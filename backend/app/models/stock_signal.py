from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Date
from sqlalchemy.sql import func
from ..core.database import Base


class StockSignal(Base):
    __tablename__ = "stock_signals"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    market = Column(String(10), nullable=False)
    signal_date = Column(Date, nullable=False)
    signal_type = Column(String(50))
    score = Column(Float, default=0.0)
    ma2 = Column(Float)
    ma10 = Column(Float)
    ma26 = Column(Float)
    ma50 = Column(Float)
    ma132 = Column(Float)
    close_price = Column(Float)
    crossover_weekly = Column(String(20))
    crossover_daily = Column(String(20))
    pivot_detected = Column(String(10))
    explanation = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
