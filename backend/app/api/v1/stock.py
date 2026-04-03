"""
FastAPI stock endpoints (Epic 6 Stock Engine).
Provides access to ST125 signals, manual triggers, and reports.
"""

from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...models.stock_signal import StockSignal

router = APIRouter(prefix="/stock", tags=["stock"])


# ── Pydantic Schemas ─────────────────────────────────────────────────────────

class StockSignalResponse(BaseModel):
    id: int
    symbol: str
    market: str
    signal_date: date
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
    phase_label: str
    phase_score: float
    close_price: Optional[float]
    volume_amount_100m: Optional[float]
    w10: Optional[float]
    w26: Optional[float]
    w52: Optional[float]
    slope_w10: Optional[float]
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
    """Return the most recent day's signals for a market."""
    latest_date = (
        db.query(func.max(StockSignal.signal_date))
        .filter(StockSignal.market == market)
        .scalar()
    )
    if not latest_date:
        return {"date": None, "market": market, "signals": []}

    signals = (
        db.query(StockSignal)
        .filter(StockSignal.market == market, StockSignal.signal_date == latest_date)
        .order_by(StockSignal.phase_score.desc())
        .limit(20)
        .all()
    )
    return {
        "date": str(latest_date),
        "market": market,
        "count": len(signals),
        "signals": [
            {
                "symbol": s.symbol,
                "phase_label": s.phase_label,
                "phase_score": s.phase_score,
                "close_price": s.close_price,
                "volume_amount_100m": s.volume_amount_100m,
                "w10": s.w10,
                "w26": s.w26,
                "w52": s.w52,
                "slope_w10": s.slope_w10,
                "sar_signal": s.sar_signal,
                "crossover_event": s.crossover_event,
                "explanation": s.explanation,
            }
            for s in signals
        ],
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
    from pathlib import Path
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
