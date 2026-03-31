from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from ...core.database import get_db
from ...models.stock_signal import StockSignal

router = APIRouter(prefix="/stock", tags=["stock"])


class StockSignalResponse(BaseModel):
    id: int
    symbol: str
    market: str
    signal_date: date
    signal_type: Optional[str]
    score: float
    close_price: Optional[float]
    crossover_weekly: Optional[str]
    crossover_daily: Optional[str]
    pivot_detected: Optional[str]
    explanation: Optional[str]

    class Config:
        from_attributes = True


class StockWatchlistItem(BaseModel):
    symbol: str
    market: str


@router.get("/signals", response_model=List[StockSignalResponse])
def list_signals(
    market: Optional[str] = None,
    signal_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    query = db.query(StockSignal)
    if market:
        query = query.filter(StockSignal.market == market)
    if signal_date:
        query = query.filter(StockSignal.signal_date == signal_date)
    return query.order_by(StockSignal.score.desc()).limit(50).all()


@router.get("/signals/latest")
def get_latest_signals(market: Optional[str] = "TW", db: Session = Depends(get_db)):
    from sqlalchemy import func
    latest_date = db.query(func.max(StockSignal.signal_date)).filter(
        StockSignal.market == market
    ).scalar()
    if not latest_date:
        return {"date": None, "signals": []}
    signals = (
        db.query(StockSignal)
        .filter(StockSignal.market == market, StockSignal.signal_date == latest_date)
        .order_by(StockSignal.score.desc())
        .limit(20)
        .all()
    )
    return {
        "date": str(latest_date),
        "market": market,
        "signals": [
            {
                "symbol": s.symbol,
                "score": s.score,
                "signal_type": s.signal_type,
                "close_price": s.close_price,
                "crossover_weekly": s.crossover_weekly,
                "crossover_daily": s.crossover_daily,
                "pivot_detected": s.pivot_detected,
                "explanation": s.explanation,
            }
            for s in signals
        ],
    }


@router.post("/refresh")
def trigger_stock_refresh(market: str = "TW", db: Session = Depends(get_db)):
    from ...models.job import Job
    job = Job(
        name=f"Stock refresh {market}",
        job_type="stock_refresh",
        input_data={"market": market},
        status="pending",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return {"message": f"Stock refresh queued for {market}", "job_id": job.id}
