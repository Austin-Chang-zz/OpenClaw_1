from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import create_tables
from .core.logging import setup_logging, get_logger
from .api.v1 import topics, scripts, jobs, stock
import uuid

setup_logging()
logger = get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("OpenClaw {} starting up — creating database tables...", settings.app_version)
    create_tables()
    logger.info("Database tables ready.")
    from .services.stock_engine.scheduler import start_scheduler, stop_scheduler
    start_scheduler()
    yield
    stop_scheduler()
    logger.info("OpenClaw shutting down.")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="OpenClaw – AI-driven content production and research automation system",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_trace_id(request: Request, call_next):
    trace_id = request.headers.get("X-Trace-Id", str(uuid.uuid4())[:8])
    with get_logger(trace_id=trace_id).contextualize(trace_id=trace_id):
        response = await call_next(request)
    response.headers["X-Trace-Id"] = trace_id
    return response


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
