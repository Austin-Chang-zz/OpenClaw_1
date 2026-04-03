"""
J6.5 – Stock Engine Scheduler
Schedules daily runs after market close:
  TW report: 14:00 TW time (UTC+8)  → 06:00 UTC
  US report: 17:00 ET  (UTC-5/UTC-4) → 22:00 UTC (winter) / 21:00 UTC (summer)

Runs as a background thread inside the FastAPI process (Phase 1).
In Phase 2 this will be replaced by the RQ Scheduler (Epic 2).
"""

import asyncio
import logging
import threading
import time
from datetime import date, datetime, timezone
from typing import Any, Dict, List

import pytz
import schedule

from .ranker import StockRanker
from .report_generator import ReportGenerator

logger = logging.getLogger(__name__)

TW_TZ = pytz.timezone("Asia/Taipei")
ET_TZ = pytz.timezone("America/New_York")

_scheduler_thread: threading.Thread = None
_stop_event = threading.Event()


def _save_signals_to_db(signals: List[Dict[str, Any]], market: str) -> int:
    """
    Upsert ranked signals into the stock_signals table.
    Matches on (symbol, market, signal_date). Returns number of rows saved.
    Uses deferred imports to avoid circular-import issues at module load.
    """
    from app.core.database import SessionLocal
    from app.models.stock_signal import StockSignal

    today = date.today()
    db = SessionLocal()
    saved = 0
    try:
        for s in signals:
            existing = (
                db.query(StockSignal)
                .filter(
                    StockSignal.symbol == s.get("symbol"),
                    StockSignal.market == market,
                    StockSignal.signal_date == today,
                )
                .first()
            )
            if existing:
                for k, v in s.items():
                    if hasattr(existing, k):
                        setattr(existing, k, v)
            else:
                row = StockSignal(**{k: v for k, v in s.items() if hasattr(StockSignal, k)})
                row.market = market
                row.signal_date = today
                db.add(row)
            saved += 1
        db.commit()
        logger.info(f"Saved {saved} {market} signals to DB for {today}")
        return saved
    except Exception as exc:
        db.rollback()
        logger.error(f"DB save failed for {market}: {exc}")
        return 0
    finally:
        db.close()


def run_tw_analysis() -> None:
    logger.info("Starting TW daily stock analysis …")
    try:
        ranker = StockRanker()
        reporter = ReportGenerator()

        tw_signals = ranker.rank_market("TW", top_n=10)
        us_signals = []

        md = reporter.generate_markdown(tw_signals, us_signals)
        reporter.save_report(md, "TW")

        if tw_signals:
            saved = _save_signals_to_db(tw_signals, "TW")
            logger.info(f"TW DB save: {saved} rows")

            tg_msg = reporter.generate_telegram_message(tw_signals, "TW")
            asyncio.run(reporter.send_telegram(tg_msg))

        logger.info(f"TW analysis complete — {len(tw_signals)} signals")
    except Exception as e:
        logger.error(f"TW analysis failed: {e}")


def run_us_analysis() -> None:
    logger.info("Starting US daily stock analysis …")
    try:
        ranker = StockRanker()
        reporter = ReportGenerator()

        us_signals = ranker.rank_market("US", top_n=10)
        tw_signals = []

        md = reporter.generate_markdown(tw_signals, us_signals)
        reporter.save_report(md, "US")

        if us_signals:
            saved = _save_signals_to_db(us_signals, "US")
            logger.info(f"US DB save: {saved} rows")

            tg_msg = reporter.generate_telegram_message(us_signals, "US")
            asyncio.run(reporter.send_telegram(tg_msg))

        logger.info(f"US analysis complete — {len(us_signals)} signals")
    except Exception as e:
        logger.error(f"US analysis failed: {e}")


def _now_local(tz) -> str:
    return datetime.now(tz).strftime("%H:%M")


def setup_schedule() -> None:
    """
    Schedule jobs based on local UTC times corresponding to:
      TW 14:00 → UTC 06:00
      ET 17:00 → UTC 22:00 (winter) / 21:00 (summer)
    """
    schedule.every().day.at("06:00").do(run_tw_analysis)
    schedule.every().day.at("22:00").do(run_us_analysis)
    logger.info("Stock engine schedule configured: TW@06:00UTC, US@22:00UTC")


def _scheduler_loop() -> None:
    setup_schedule()
    logger.info("Stock engine scheduler started")
    while not _stop_event.is_set():
        schedule.run_pending()
        time.sleep(60)
    logger.info("Stock engine scheduler stopped")


def start_scheduler() -> None:
    """Start the background scheduler thread (called from FastAPI lifespan)."""
    global _scheduler_thread
    if _scheduler_thread and _scheduler_thread.is_alive():
        return
    _stop_event.clear()
    _scheduler_thread = threading.Thread(
        target=_scheduler_loop, name="stock-scheduler", daemon=True
    )
    _scheduler_thread.start()
    logger.info("Stock engine scheduler thread started")


def stop_scheduler() -> None:
    """Stop the background scheduler thread (called on app shutdown)."""
    _stop_event.set()
    if _scheduler_thread:
        _scheduler_thread.join(timeout=5)
    logger.info("Stock engine scheduler thread stopped")


def trigger_now(market: str) -> dict:
    """
    Manually trigger an analysis run immediately (used by the API).
    Returns immediately; analysis runs in a background thread.
    """
    if market == "TW":
        t = threading.Thread(target=run_tw_analysis, daemon=True)
    else:
        t = threading.Thread(target=run_us_analysis, daemon=True)
    t.start()
    return {"triggered": True, "market": market, "thread": t.name}
