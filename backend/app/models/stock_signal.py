from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Date, Boolean
from sqlalchemy.sql import func
from ..core.database import Base


class StockSignal(Base):
    __tablename__ = "stock_signals"

    id = Column(Integer, primary_key=True, index=True)

    symbol = Column(String(20), nullable=False, index=True)
    market = Column(String(10), nullable=False, index=True)
    signal_date = Column(Date, nullable=False, index=True)

    close_price = Column(Float)
    volume = Column(Float)
    volume_amount_100m = Column(Float)

    w2 = Column(Float)
    w10 = Column(Float)
    w26 = Column(Float)
    w52 = Column(Float)

    d2 = Column(Float)
    d10 = Column(Float)
    d50 = Column(Float)
    d132 = Column(Float)
    d260 = Column(Float)

    slope_w2 = Column(Float)
    slope_w10 = Column(Float)
    slope_w26 = Column(Float)
    slope_w52 = Column(Float)

    sar_value = Column(Float)
    sar_signal = Column(String(10))

    phase_label = Column(String(5), index=True)
    phase_score = Column(Float, default=0.0)

    crossover_event = Column(String(30))
    explanation = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    ma2 = Column(Float)
    ma10 = Column(Float)
    ma26 = Column(Float)
    ma50 = Column(Float)
    ma132 = Column(Float)
    signal_type = Column(String(50))
    score = Column(Float, default=0.0)
    crossover_weekly = Column(String(20))
    crossover_daily = Column(String(20))
    pivot_detected = Column(String(10))
    stock_name = Column(String(200))
    eps = Column(Float)
