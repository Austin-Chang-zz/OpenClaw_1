from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ...core.database import get_db
from ...models.topic import Topic, TopicCategory, TopicStatus

router = APIRouter(prefix="/topics", tags=["topics"])


class TopicCreate(BaseModel):
    title: str
    angle: Optional[str] = None
    audience: Optional[str] = None
    category: str = TopicCategory.HOT_TOPICS
    language: str = "zh-TW"
    reference_links: Optional[str] = None
    controversy_level: int = 1
    monetization_potential: int = 5
    platform_fit: Optional[str] = None
    notes: Optional[str] = None


class TopicUpdate(BaseModel):
    title: Optional[str] = None
    angle: Optional[str] = None
    status: Optional[str] = None
    score: Optional[float] = None
    notes: Optional[str] = None


class TopicResponse(BaseModel):
    id: int
    title: str
    angle: Optional[str]
    audience: Optional[str]
    category: str
    language: str
    controversy_level: int
    monetization_potential: int
    score: float
    status: str
    platform_fit: Optional[str]
    notes: Optional[str]

    class Config:
        from_attributes = True


@router.get("/", response_model=List[TopicResponse])
def list_topics(
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Topic)
    if category:
        query = query.filter(Topic.category == category)
    if status:
        query = query.filter(Topic.status == status)
    return query.order_by(Topic.created_at.desc()).all()


@router.post("/", response_model=TopicResponse)
def create_topic(topic: TopicCreate, db: Session = Depends(get_db)):
    db_topic = Topic(**topic.model_dump())
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic


@router.get("/{topic_id}", response_model=TopicResponse)
def get_topic(topic_id: int, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


@router.patch("/{topic_id}", response_model=TopicResponse)
def update_topic(topic_id: int, update: TopicUpdate, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(topic, field, value)
    db.commit()
    db.refresh(topic)
    return topic


@router.delete("/{topic_id}")
def delete_topic(topic_id: int, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    db.delete(topic)
    db.commit()
    return {"message": "Topic deleted"}
