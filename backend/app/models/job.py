from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from ..core.database import Base


class JobStatus(str):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"
    RETRYING = "retrying"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    job_type = Column(String(100), nullable=False)
    status = Column(String(50), default="pending")
    input_data = Column(JSON)
    output_data = Column(JSON)
    error_message = Column(Text)
    retries = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))
