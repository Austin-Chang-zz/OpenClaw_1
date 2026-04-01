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
- `Fundamental_usecase_and_skills.md` – Defines the 10 fundamental AI skills, 3 operational protocols, and 7 core use cases with their phase mapping

## Fundamental Skills, Protocols & Use Cases

Source: `User/Fundamental_usecase_and_skills.md`

This file defines the **intelligence layer** of OpenClaw — the AI behaviours, protocols, and use cases that turn the structural modules (database, API, UI) into an autonomous agent system. Each item is mapped to the phase and Epic/Jobs where it gets implemented.

### Skills

| # | Skill | Phase | Epic / Jobs | Notes |
|---|-------|-------|-------------|-------|
| 1 | **skill-vetting** | Phase 1 (Month 1) | Epic 1 (J1.3, J1.4) | Validates AI output quality before it enters production; a meta-layer that approves/rejects generated scripts and signals |
| 2 | **self-improving-agent** | Phase 5 (Month 5) | Epic 2 (J2.3), G2 (Knowledge Base) | After the full pipeline runs, the agent reviews its own performance and refines prompt templates autonomously |
| 3 | **tavily-search** | Phase 2 (Month 2) | Epic 3 (J3.1) | Powers the Topic Research Collector — web search for trending topics on YouTube, TikTok, Reddit, and X |
| 4 | **summarize** (+ tavily+summary) | Phase 2 (Month 2) | Epic 3 (J3.1, J3.2) | Companion to tavily-search; converts raw search results into structured topic briefs and content angles |
| 5 | **find-skills** (vercel: skills.sh) | Phase 1 (Month 1) | Epic 1 (J1.5) | Agent tooling infrastructure — how the system discovers and installs new automation skills |
| 6 | **Using-superpower** | Phase 3 (Month 3) | Epic 4 (J4.2) | Activates AI image and video generation (the "Pixel" thumbnail agent in the Autonomous Content Factory) |
| 7 | **vercel-react-best-practices** | Phase 1–2 | Epic 7 (J7.1) | Applied from the start as the frontend design standard for the admin dashboard and public site |
| 8 | **frontend-design** (Anthropic) | Phase 2 (Month 2) | Epic 7 (J7.1, J7.3) | Shapes the admin dashboard UI and public website skeleton |
| 9 | **github** | Phase 1 (Month 1) | Epic 1 (J1.1, J1.5) | CI/CD pipelines, version control for workflows and prompt libraries |
| 10 | **agent-browser** | Phase 3 (Month 3) | Epic 3 (J3.1), Epic 4 (J4.x) | Playwright-based headless browser for scraping trend data and social media monitoring |

### Protocols

| Protocol | Phase | Purpose |
|----------|-------|---------|
| **Self-Improvement** | Phase 5 (Month 5) | Agent audits its own script quality, cost per output, and success rate, then updates its own prompt library without human intervention |
| **EvoMap Collaborative** | Phase 5 (Month 5) | Multi-agent coordination: separate specialised agents run in parallel for research, scripting, image generation, and publishing |
| **MEMOS Tensor Memory** | Phase 5 (Month 5) | Long-term memory system backing the RAG-lite knowledge base (Job G2) — indexes Telegram/iMessage notes, transcripts, and documents for semantic retrieval |

### Use Cases

| Use Case | Phase | Epics / Jobs | How It Is Built |
|----------|-------|-------------|-----------------|
| **Personal Second Brain** | Phase 5 (Month 5) | Epic 5 (J5.2), G2 (Knowledge Base) | Telegram bot (J5.2) acts as the ingest channel; MEMOS Tensor Memory + RAG-lite (G2) stores and surfaces ideas on demand via the Next.js dashboard |
| **Custom Automated Morning Brief** | Phase 2–4 | J2.4 (Scheduler), J3.2 (Script Generator), J6.5 (Stock Report) | Cron scheduler triggers at 08:00 daily; brief combines AI-curated content ideas, a fresh video script draft, and the latest stock signals |
| **Autonomous Content Factory** | Phase 3 (Month 3) | Epic 4 (J4.x), Epic 5 (J5.x), Epic 2 (J2.3) | Discord integration coordinates specialised agents (researcher → writer → "Pixel" for thumbnails) using the EvoMap Collaborative protocol |
| **Market & Opportunity Research** | Phase 2 (Month 2) | Epic 3 (J3.1) | tavily-search + summarize skills scan Reddit and X for pain points; results are scored and routed into the Topic Collector |
| **Goal-Oriented Task Execution** | Phase 5 (Month 5) | F3 (Analytics), Epic 2 (J2.4) | After a brain-dump session, the self-improving agent generates and schedules 4–5 daily tasks; progress is tracked on a Kanban board in the admin dashboard |
| **Mission Control Software** | Phase 2 (Month 2) | Epic 7 (J7.x) | The admin dashboard (Epic 7) is precisely this concept — a single Next.js interface centralising topic inbox, script editor, stock dashboard, publish scheduler, and job monitor |
| **Cost Management (MiniMax/GLM-4)** | Phase 1–2 | J1.3 (Secrets), `backend/app/providers/` | Provider adapter architecture in `backend/app/providers/text/` and `backend/app/providers/tts/` allows routing between cheap (MiniMax 2.5, GLM-4, DeepSeek), balanced, and premium (OpenAI, Anthropic) tiers per task |
