from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import create_tables
from .api.v1 import topics, scripts, jobs, stock
import os

os.makedirs("logs", exist_ok=True)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="OpenClaw – AI-driven content production and research automation system",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    create_tables()


@app.get("/")
def root():
    return {"name": settings.app_name, "version": settings.app_version, "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(topics.router, prefix="/api/v1")
app.include_router(scripts.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(stock.router, prefix="/api/v1")
