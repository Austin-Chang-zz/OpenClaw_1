from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)


_STOCK_SIGNAL_MIGRATIONS = [
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS volume DOUBLE PRECISION",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS volume_amount_100m DOUBLE PRECISION",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS w2 DOUBLE PRECISION",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS w10 DOUBLE PRECISION",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS w26 DOUBLE PRECISION",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS w52 DOUBLE PRECISION",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS d2 DOUBLE PRECISION",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS d10 DOUBLE PRECISION",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS d50 DOUBLE PRECISION",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS d132 DOUBLE PRECISION",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS d260 DOUBLE PRECISION",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS slope_w2 DOUBLE PRECISION",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS slope_w10 DOUBLE PRECISION",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS slope_w26 DOUBLE PRECISION",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS slope_w52 DOUBLE PRECISION",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS sar_value DOUBLE PRECISION",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS sar_signal VARCHAR(10)",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS phase_label VARCHAR(5)",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS phase_score DOUBLE PRECISION",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS crossover_event VARCHAR(30)",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS stock_name VARCHAR(200)",
    "ALTER TABLE stock_signals ADD COLUMN IF NOT EXISTS eps DOUBLE PRECISION",
]


def apply_migrations():
    """
    Idempotent column migrations — safe to run on every startup.
    Adds any columns that exist in the model but are missing from the table.
    """
    with engine.connect() as conn:
        for stmt in _STOCK_SIGNAL_MIGRATIONS:
            conn.execute(text(stmt))
        conn.commit()
