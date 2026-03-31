# OpenClaw – Replit Project

## Project Overview

OpenClaw is a secure, AI-driven content production and research automation system. It provides:
- **Topic Inbox** for managing content ideas by category
- **Script Studio** for multilingual video script creation
- **Stock Engine** for daily stock signals (102.5 theory: MA crossovers + pivot points)
- **Job Monitor** for background task tracking

## Architecture

### Frontend (Port 5000)
- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Location:** `frontend/`
- **Entry:** `frontend/app/page.tsx`

### Backend (Port 3001)
- **Framework:** FastAPI (Python 3.11)
- **ORM:** SQLAlchemy with PostgreSQL
- **Language:** Python
- **Location:** `backend/`
- **Entry:** `backend/app/main.py`

### Database
- **Type:** PostgreSQL (Replit built-in)
- **ORM:** SQLAlchemy
- **Tables:** topics, scripts, jobs, stock_signals
- **Auto-created** on startup via `create_tables()`

## Running the Application

Single workflow: `bash run.sh`
- Starts FastAPI backend on `localhost:3001`
- Starts Next.js frontend on `0.0.0.0:5000`
- Frontend proxies `/api/*` → backend via `next.config.js`

## Key Files

- `run.sh` – Main startup script
- `backend/app/main.py` – FastAPI app with all routers
- `backend/app/core/config.py` – Settings via pydantic-settings
- `backend/app/core/database.py` – SQLAlchemy setup
- `backend/app/models/` – SQLAlchemy models (topic, script, job, stock_signal)
- `backend/app/api/v1/` – REST API endpoints
- `frontend/next.config.js` – Next.js config with API proxy rewrite
- `frontend/app/` – Next.js pages (page.tsx, topics/, scripts/, stock/, jobs/)

## Environment Variables

- `DATABASE_URL` – PostgreSQL connection string (auto-set by Replit)
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` – Auto-set by Replit
- `OPENAI_API_KEY` – Optional: for AI script generation
- `ANTHROPIC_API_KEY` – Optional: for AI features
- `DEEPSEEK_API_KEY` – Optional: cost-effective Chinese AI provider

## Dependencies

### Python packages
fastapi, uvicorn, sqlalchemy, psycopg2-binary, pydantic, pydantic-settings, python-dotenv, httpx, loguru, pandas, yfinance, redis, rq, alembic

### Node.js packages
next@14, react@18, tailwindcss, lucide-react, @radix-ui/*

## Content Categories

- 平甩功 (Ping Shuai Gong)
- 老人養生 (Senior Wellness)
- 人生哲理 (Life Philosophy)
- 特異功能 (Extraordinary Abilities)
- 前世今生 (Past Lives)
- Hot Topics
- Coding/Workflow
- Stock Analysis

## User Documents

Planning and PRD documents are in `User/`:
- `OpenClaw_LkkViber_PRD_1.1.md` – Full product requirements
- `OpenClaw_for_replit_joblist_1.1.md` – Job tickets by Epic
- `OpenClaw_implementation_Plan.md` – Implementation roadmap
