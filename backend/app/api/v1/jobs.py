from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from ...core.database import get_db
from ...models.job import Job

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobCreate(BaseModel):
    name: str
    job_type: str
    input_data: Optional[dict] = None


class JobResponse(BaseModel):
    id: int
    name: str
    job_type: str
    status: str
    input_data: Optional[dict]
    output_data: Optional[dict]
    error_message: Optional[str]
    retries: int

    class Config:
        from_attributes = True


@router.get("/", response_model=List[JobResponse])
def list_jobs(
    status: Optional[str] = None,
    job_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Job)
    if status:
        query = query.filter(Job.status == status)
    if job_type:
        query = query.filter(Job.job_type == job_type)
    return query.order_by(Job.created_at.desc()).limit(100).all()


@router.post("/", response_model=JobResponse)
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    db_job = Job(**job.model_dump())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.patch("/{job_id}/cancel")
def cancel_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = "cancelled"
    db.commit()
    return {"message": "Job cancelled"}
