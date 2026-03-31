from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..core.database import Base


class Script(Base):
    __tablename__ = "scripts"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    hook = Column(Text)
    cta = Column(Text)
    language = Column(String(10), default="zh-TW")
    tone = Column(String(50), default="storytelling")
    duration_seconds = Column(Integer, default=60)
    version = Column(Integer, default=1)
    status = Column(String(50), default="draft")
    metadata_title = Column(String(500))
    metadata_description = Column(Text)
    metadata_hashtags = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
