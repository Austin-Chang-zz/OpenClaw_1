"""
FastAPI stock endpoints (Epic 6 Stock Engine).
Provides access to ST125 signals, manual triggers, and reports.
"""

import logging
import math
from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from ...core.database import get_db
from ...models.stock_signal import StockSignal

router = APIRouter(prefix="/stock", tags=["stock"])


# ── Pydantic Schemas ─────────────────────────────────────────────────────────

class StockSignalResponse(BaseModel):
    id: int
    symbol: str
    market: str
    signal_date: date
    stock_name: Optional[str] = None
    phase_label: Optional[str] = None
    phase_score: Optional[float] = None
    score: Optional[float] = None
    close_price: Optional[float] = None
    volume_amount_100m: Optional[float] = None
    w2: Optional[float] = None
    w10: Optional[float] = None
    w26: Optional[float] = None
    w52: Optional[float] = None
    slope_w10: Optional[float] = None
    slope_w26: Optional[float] = None
    slope_w52: Optional[float] = None
    sar_signal: Optional[str] = None
    crossover_event: Optional[str] = None
    explanation: Optional[str] = None

    class Config:
        from_attributes = True


class AnalysisTriggerResponse(BaseModel):
    triggered: bool
    market: str
    message: str


class LiveSignalItem(BaseModel):
    symbol: str
    market: str
    stock_name: Optional[str] = None
    phase_label: str
    phase_score: float
    close_price: Optional[float]
    volume_amount_100m: Optional[float]
    w10: Optional[float]
    w26: Optional[float]
    w52: Optional[float]
    slope_w10: Optional[float]
    slope_w26: Optional[float] = None
    slope_w52: Optional[float] = None
    sar_signal: Optional[str]
    crossover_event: Optional[str]
    explanation: Optional[str]


# ── Helpers ──────────────────────────────────────────────────────────────────

def _save_signals(db: Session, signals: List[Dict[str, Any]], market: str) -> int:
    """Upsert signals for today into the database."""
    today = date.today()
    saved = 0
    for s in signals:
        existing = (
            db.query(StockSignal)
            .filter(
                StockSignal.symbol == s["symbol"],
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
            db.add(row)
        saved += 1
    db.commit()
    return saved


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/signals", response_model=List[StockSignalResponse])
def list_signals(
    market: Optional[str] = Query(None, description="TW or US"),
    signal_date: Optional[date] = Query(None),
    phase: Optional[str] = Query(None, description="Filter by phase e.g. A2"),
    min_score: Optional[float] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """List historical signals from the database."""
    query = db.query(StockSignal)
    if market:
        query = query.filter(StockSignal.market == market)
    if signal_date:
        query = query.filter(StockSignal.signal_date == signal_date)
    if phase:
        query = query.filter(StockSignal.phase_label == phase)
    if min_score is not None:
        query = query.filter(StockSignal.phase_score >= min_score)
    return query.order_by(StockSignal.phase_score.desc()).limit(limit).all()


@router.get("/signals/latest", response_model=Dict[str, Any])
def get_latest_signals(
    market: str = Query("TW", description="TW or US"),
    db: Session = Depends(get_db),
):
    """
    Return the most recent day's signals for a market.
    US: Big 7 + TSM are always returned first (in fixed order), then up to 10 ranked signals.
    TW: Top 10 by phase_score.
    """
    from ...services.stock_engine.ranker import BIG7_TSM, BIG7_TSM_SET

    latest_date = (
        db.query(func.max(StockSignal.signal_date))
        .filter(StockSignal.market == market)
        .scalar()
    )
    if not latest_date:
        return {"date": None, "market": market, "count": 0, "signals": []}

    all_rows = (
        db.query(StockSignal)
        .filter(StockSignal.market == market, StockSignal.signal_date == latest_date)
        .order_by(StockSignal.phase_score.desc())
        .limit(30)
        .all()
    )

    if market == "US":
        pinned_map = {s.symbol: s for s in all_rows if s.symbol in BIG7_TSM_SET}
        pinned = [pinned_map[sym] for sym in BIG7_TSM if sym in pinned_map]
        ranked = [s for s in all_rows if s.symbol not in BIG7_TSM_SET][:10]
        ordered = pinned + ranked
    else:
        ordered = all_rows[:10]

    def _row(s: StockSignal) -> Dict[str, Any]:
        return {
            "symbol": s.symbol,
            "stock_name": s.stock_name,
            "phase_label": s.phase_label,
            "phase_score": s.phase_score,
            "close_price": s.close_price,
            "volume_amount_100m": s.volume_amount_100m,
            "eps": s.eps,
            "w10": s.w10,
            "w26": s.w26,
            "w52": s.w52,
            "slope_w10": s.slope_w10,
            "slope_w26": s.slope_w26,
            "slope_w52": s.slope_w52,
            "sar_signal": s.sar_signal,
            "crossover_event": s.crossover_event,
            "explanation": s.explanation,
        }

    return {
        "date": str(latest_date),
        "market": market,
        "count": len(ordered),
        "signals": [_row(s) for s in ordered],
    }


@router.post("/run-analysis", response_model=AnalysisTriggerResponse)
def run_analysis(
    market: str = Query("TW", description="TW or US"),
    top_n: int = Query(10, ge=1, le=50),
    save_to_db: bool = Query(True),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
):
    """
    Trigger a full ST125 analysis run immediately.
    Returns top N signals and optionally saves them to the database.
    Runs synchronously (can take 2-5 minutes for a full watchlist).
    """
    try:
        from ...services.stock_engine.ranker import StockRanker
        ranker = StockRanker()
        signals = ranker.rank_market(market=market, top_n=top_n)

        if save_to_db and signals:
            saved = _save_signals(db, signals, market)
        else:
            saved = 0

        return {
            "triggered": True,
            "market": market,
            "message": f"Analysis complete. {len(signals)} signals found, {saved} saved to DB.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/run-analysis/async", response_model=AnalysisTriggerResponse)
def run_analysis_async(
    market: str = Query("TW", description="TW or US"),
    db: Session = Depends(get_db),
):
    """
    Trigger an analysis run in the background (non-blocking).
    Use GET /signals/latest to retrieve results once complete.
    """
    from ...services.stock_engine.scheduler import trigger_now
    result = trigger_now(market)
    return {
        "triggered": True,
        "market": market,
        "message": f"Background analysis started for {market} market.",
    }


@router.get("/live", response_model=List[LiveSignalItem])
def get_live_signals(
    market: str = Query("TW", description="TW or US"),
    symbols: Optional[str] = Query(None, description="Comma-separated symbols to analyse"),
    top_n: int = Query(10, ge=1, le=50),
):
    """
    Run live real-time analysis without saving to DB.
    Specify symbols= for a quick single-stock check (e.g. ?symbols=2330.TW,2317.TW).
    """
    from ...services.stock_engine.ranker import StockRanker
    ranker = StockRanker()

    if symbols:
        sym_list = [s.strip() for s in symbols.split(",") if s.strip()]
        results = []
        for sym in sym_list:
            signal = ranker.analyse_symbol(sym, market)
            if signal:
                from ...services.stock_engine.scorer import PhaseScorer
                signal["phase_score"] = PhaseScorer.calculate(
                    signal["phase_label"],
                    slope_w10=signal.get("slope_w10"),
                )
                results.append(signal)
        return results

    signals = ranker.rank_market(market=market, top_n=top_n)
    return signals


@router.get("/report/latest", response_model=Dict[str, Any])
def get_latest_report(market: str = Query("TW")):
    """Return the contents of the latest saved markdown report."""
    from ...services.stock_engine.report_generator import REPORT_DIR
    report_dir = REPORT_DIR
    pattern = f"st125_{market}_*.md"
    files = sorted(report_dir.glob(pattern))
    if not files:
        return {"market": market, "report": None, "message": "No reports found"}
    latest = files[-1]
    return {
        "market": market,
        "filename": latest.name,
        "report": latest.read_text(encoding="utf-8"),
    }


@router.get("/phases/legend", response_model=Dict[str, Any])
def get_phases_legend():
    """Return the ST125 phase scoring legend."""
    from ...services.stock_engine.scorer import PHASE_BASE_SCORES
    from ...services.stock_engine.scorer import PhaseScorer
    legend = []
    for phase, score in sorted(PHASE_BASE_SCORES.items(), key=lambda x: -x[1]):
        legend.append({
            "phase": phase,
            "base_score": score,
            "group": PhaseScorer.phase_group(phase),
            "is_entry": PhaseScorer.is_entry_signal(phase),
            "is_exit": PhaseScorer.is_exit_signal(phase),
        })
    return {"phases": legend, "total": len(legend)}


@router.get("/{symbol}/chart-data")
def get_chart_data(
    symbol: str,
    weeks: int = Query(104, ge=52, le=260, description="Number of weekly bars to return"),
):
    """
    Return weekly OHLCV, W2/W10/W26/W52 MA lines, Parabolic SAR, and
    fundamentals (P/E, market cap, EPS, 52-wk range, revenue, sector) for a symbol.
    """
    try:
        import yfinance as yf
        from ...services.stock_engine.data_fetcher import StockDataFetcher
        from ...services.stock_engine.ma_calculator import MACalculator

        fetcher = StockDataFetcher()
        years = max(2, math.ceil(weeks / 52))

        weekly_df = fetcher.fetch_weekly_ohlcv(symbol, years=years)
        if weekly_df is None or weekly_df.empty:
            raise HTTPException(status_code=404, detail=f"No weekly data for {symbol}")

        weekly_df = MACalculator.calculate_weekly_mas(weekly_df)
        weekly_df = weekly_df.tail(weeks)

        def _safe(v):
            try:
                f = float(v)
                return None if math.isnan(f) or math.isinf(f) else f
            except (TypeError, ValueError):
                return None

        # Build OHLCV bars
        ohlcv = []
        for ts, row in weekly_df.iterrows():
            ohlcv.append({
                "time": ts.strftime("%Y-%m-%d"),
                "open":   round(float(row["Open"]),  4),
                "high":   round(float(row["High"]),  4),
                "low":    round(float(row["Low"]),   4),
                "close":  round(float(row["Close"]), 4),
                "volume": int(row["Volume"]) if _safe(row["Volume"]) is not None else 0,
            })

        # Build MA line series
        ma_lines: Dict[str, List[Dict]] = {}
        for col in ["W2", "W10", "W26", "W52"]:
            series = []
            for ts, row in weekly_df.iterrows():
                v = _safe(row.get(col))
                if v is not None:
                    series.append({"time": ts.strftime("%Y-%m-%d"), "value": round(v, 4)})
            ma_lines[col.lower()] = series

        # Build SAR points
        sar_points = []
        for ts, row in weekly_df.iterrows():
            sv = _safe(row.get("sar_value"))
            sig = str(row.get("sar_signal", "unknown"))
            if sv is not None and sig in ("low", "high"):
                sar_points.append({
                    "time": ts.strftime("%Y-%m-%d"),
                    "value": round(sv, 4),
                    "signal": sig,
                })

        # Fetch fundamentals from yfinance
        fundamentals: Dict[str, Any] = {}
        stock_name = None
        try:
            from ...services.stock_engine.ranker import TW_NAMES, US_NAMES
            stock_name = TW_NAMES.get(symbol) or US_NAMES.get(symbol)
        except Exception:
            pass

        try:
            ticker = yf.Ticker(symbol)
            fi = ticker.fast_info
            info: Dict[str, Any] = {}
            try:
                info = ticker.info or {}
            except Exception:
                pass

            if not stock_name:
                stock_name = (
                    getattr(fi, "shortName", None)
                    or info.get("shortName")
                    or info.get("longName")
                    or symbol
                )

            fundamentals = {
                "market_cap":    _safe(getattr(fi, "market_cap", None) or info.get("marketCap")),
                "pe_ratio":      _safe(info.get("trailingPE") or info.get("forwardPE")),
                "eps":           _safe(info.get("trailingEps")),
                "week_52_high":  _safe(getattr(fi, "year_high", None) or info.get("fiftyTwoWeekHigh")),
                "week_52_low":   _safe(getattr(fi, "year_low",  None) or info.get("fiftyTwoWeekLow")),
                "revenue_ttm":   _safe(info.get("totalRevenue")),
                "dividend_yield": _safe(info.get("dividendYield") or info.get("trailingAnnualDividendYield")),
                "sector":        info.get("sector"),
                "industry":      info.get("industry"),
                "currency":      getattr(fi, "currency", None) or info.get("currency"),
                "exchange":      info.get("exchange") or info.get("fullExchangeName"),
            }
        except Exception as exc:
            logger.warning(f"Fundamentals fetch failed for {symbol}: {exc}")

        return {
            "symbol":       symbol,
            "stock_name":   stock_name,
            "ohlcv":        ohlcv,
            "ma_lines":     ma_lines,
            "sar":          sar_points,
            "fundamentals": fundamentals,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"chart-data failed for {symbol}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/signals/history")
def signals_history(
    symbol: str = Query(..., description="Stock symbol e.g. 2330.TW"),
    market: str = Query("TW"),
    limit: int = Query(30, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Return phase history for a single symbol."""
    rows = (
        db.query(StockSignal)
        .filter(StockSignal.symbol == symbol, StockSignal.market == market)
        .order_by(StockSignal.signal_date.desc())
        .limit(limit)
        .all()
    )
    return {
        "symbol": symbol,
        "market": market,
        "count": len(rows),
        "history": [
            {
                "date": str(r.signal_date),
                "phase_label": r.phase_label,
                "phase_score": r.phase_score,
                "close_price": r.close_price,
                "slope_w10": r.slope_w10,
                "sar_signal": r.sar_signal,
            }
            for r in rows
        ],
    }
