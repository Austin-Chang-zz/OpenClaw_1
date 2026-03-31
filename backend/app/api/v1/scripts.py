from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ...core.database import get_db
from ...models.script import Script

router = APIRouter(prefix="/scripts", tags=["scripts"])


class ScriptCreate(BaseModel):
    topic_id: Optional[int] = None
    title: str
    content: str
    hook: Optional[str] = None
    cta: Optional[str] = None
    language: str = "zh-TW"
    tone: str = "storytelling"
    duration_seconds: int = 60
    metadata_title: Optional[str] = None
    metadata_description: Optional[str] = None
    metadata_hashtags: Optional[str] = None


class ScriptUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    hook: Optional[str] = None
    cta: Optional[str] = None
    status: Optional[str] = None
    metadata_title: Optional[str] = None
    metadata_description: Optional[str] = None
    metadata_hashtags: Optional[str] = None


class ScriptResponse(BaseModel):
    id: int
    topic_id: Optional[int]
    title: str
    content: str
    hook: Optional[str]
    cta: Optional[str]
    language: str
    tone: str
    duration_seconds: int
    version: int
    status: str
    metadata_title: Optional[str]
    metadata_description: Optional[str]
    metadata_hashtags: Optional[str]

    class Config:
        from_attributes = True


@router.get("/", response_model=List[ScriptResponse])
def list_scripts(
    status: Optional[str] = None,
    language: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Script)
    if status:
        query = query.filter(Script.status == status)
    if language:
        query = query.filter(Script.language == language)
    return query.order_by(Script.created_at.desc()).all()


@router.post("/", response_model=ScriptResponse)
def create_script(script: ScriptCreate, db: Session = Depends(get_db)):
    db_script = Script(**script.model_dump())
    db.add(db_script)
    db.commit()
    db.refresh(db_script)
    return db_script


@router.get("/{script_id}", response_model=ScriptResponse)
def get_script(script_id: int, db: Session = Depends(get_db)):
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return script


@router.patch("/{script_id}", response_model=ScriptResponse)
def update_script(script_id: int, update: ScriptUpdate, db: Session = Depends(get_db)):
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(script, field, value)
    db.commit()
    db.refresh(script)
    return script


@router.delete("/{script_id}")
def delete_script(script_id: int, db: Session = Depends(get_db)):
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    db.delete(script)
    db.commit()
    return {"message": "Script deleted"}
