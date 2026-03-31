from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Enum
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class TopicCategory(str, enum.Enum):
    PING_SHUAI_GONG = "ping_shuai_gong"
    SENIOR_WELLNESS = "senior_wellness"
    LIFE_PHILOSOPHY = "life_philosophy"
    EXTRAORDINARY = "extraordinary"
    PAST_LIVES = "past_lives"
    HOT_TOPICS = "hot_topics"
    CODING = "coding"
    STOCK = "stock"


class TopicStatus(str, enum.Enum):
    IDEA = "idea"
    SCORING = "scoring"
    APPROVED = "approved"
    IN_PRODUCTION = "in_production"
    DONE = "done"
    REJECTED = "rejected"


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    angle = Column(Text)
    audience = Column(String(255))
    category = Column(String(50), default=TopicCategory.HOT_TOPICS)
    language = Column(String(10), default="zh-TW")
    reference_links = Column(Text)
    controversy_level = Column(Integer, default=1)
    monetization_potential = Column(Integer, default=5)
    score = Column(Float, default=0.0)
    status = Column(String(50), default=TopicStatus.IDEA)
    platform_fit = Column(String(255))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
