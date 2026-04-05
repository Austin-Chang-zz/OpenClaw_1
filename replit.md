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

## Project Structure

```
OpenClaw/
├── backend/                        # Python FastAPI application
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── topics.py       # Topic Inbox REST endpoints
│   │   │       ├── scripts.py      # Script Studio REST endpoints
│   │   │       ├── jobs.py         # Job Monitor REST endpoints
│   │   │       └── stock.py        # Stock Engine REST endpoints
│   │   ├── core/
│   │   │   ├── config.py           # pydantic-settings, env var loading & validation
│   │   │   ├── database.py         # SQLAlchemy engine, session, Base
│   │   │   └── logging.py          # Structured JSON logger (loguru), rotation
│   │   ├── models/
│   │   │   ├── topic.py            # Topic table (category, status, score)
│   │   │   ├── script.py           # Script table (language, tone, duration, version)
│   │   │   ├── job.py              # Job table (status, retries, input/output)
│   │   │   └── stock_signal.py     # StockSignal table (MA values, crossover, pivot)
│   │   ├── providers/              # AI provider adapter layer (planned – Epic 3/4)
│   │   │   ├── text/               # LLM adapters: OpenAI, Anthropic, DeepSeek, GLM-4
│   │   │   ├── tts/                # TTS adapters: Edge, ElevenLabs, MiniMax
│   │   │   ├── image/              # Image gen adapters (planned)
│   │   │   └── video/              # Video gen adapters (planned)
│   │   ├── services/               # Business logic engines (planned – Epic 2–6)
│   │   │   ├── workflow_engine/    # Task queue, DAG scheduler, retry logic
│   │   │   ├── content_engine/     # Script generator, hook/CTA, metadata packaging
│   │   │   ├── stock_engine/       # MA calculator, crossover/pivot detector, reporter
│   │   │   └── video_pipeline/     # TTS → visuals → ffmpeg assembly → subtitle burn
│   │   ├── utils/                  # Shared helpers (planned)
│   │   └── main.py                 # FastAPI app entry point, router registration
│   └── requirements.txt
│
├── frontend/                       # Next.js 14 App Router admin dashboard
│   ├── app/
│   │   ├── layout.tsx              # Root layout, global metadata
│   │   ├── page.tsx                # Dashboard home (stats, module nav, pipeline overview)
│   │   ├── globals.css             # Tailwind base styles
│   │   ├── topics/page.tsx         # Topic Inbox – list, add, filter by category/status
│   │   ├── scripts/page.tsx        # Script Studio – list, create, view hook/body/CTA
│   │   ├── stock/page.tsx          # Stock Engine – 102.5 signals table, refresh trigger
│   │   └── jobs/page.tsx           # Job Monitor – list, status filter, cancel
│   ├── components/
│   │   ├── StockChartWindow.tsx    # Floating weekly K-chart (react-rnd + lightweight-charts)
│   │   └── ui/                     # Shared UI components (planned)
│   ├── lib/                        # Utility functions (planned)
│   ├── next.config.js              # API proxy rewrite: /api/* → localhost:3001
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── docker/                         # Docker Sandbox (planned – Epic 1 / J1.2)
│   ├── app.Dockerfile              # Python 3.11 – FastAPI app container
│   ├── worker.Dockerfile           # Python 3.11 – background worker container
│   └── docker-compose.yml          # Services: app, worker, postgres, redis, ffmpeg
│
├── scripts/                        # Utility scripts (planned – Epic 1 / J1.5)
│   ├── setup.sh                    # One-command setup: checks Docker, ports, runs compose
│   ├── reset_docker.sh             # Tear down and rebuild containers cleanly
│   └── backup.sh                   # Backup data volumes
│
├── data/
│   ├── knowledge_base/             # User notes, PDFs, Notion exports for RAG (planned)
│   ├── transcripts/                # Video transcripts for content extraction (planned)
│   └── assets/                     # Generated media assets (planned)
│
├── tests/                          # Test suites (planned)
├── docs/                           # Extended documentation (planned)
│
├── skills/                         # OpenClaw agent skill modules
│   └── github/                     # GitHub Skill (Phase 1 / J1.1)
│       ├── SKILL.md                # Capability docs, GITHUB_TOKEN guide, example commands
│       └── config.yml              # YAML config template (planned)
│
├── .github/                        # GitHub repository automation
│   └── workflows/
│       ├── ci.yml                  # CI: lint + backend smoke test + frontend build on PRs
│       └── deploy.yml              # Deploy stub: manual trigger, Replit deploy path planned
│
├── User/                           # Planning & PRD documents (read-only reference)
│   ├── OpenClaw_LkkViber_PRD_1.1.md
│   ├── OpenClaw_LkkViber_Epic1_1.1.md
│   ├── OpenClaw_for_replit_joblist_1.1.md
│   ├── OpenClaw_implementation_Plan.md
│   ├── Fundamental_usecase_and_skills.md
│   └── github_skill.md             # GitHub Skill capability specification (Chinese)
│
├── run.sh                          # Combined startup: backend (port 3001) + frontend (port 5000)
├── .env.example                    # Template for all required environment variables
├── README.md                       # Project overview and quick-start guide
└── replit.md                       # This file – agent memory and architecture reference
```

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
next@14, react@18, tailwindcss, lucide-react, @radix-ui/*, lightweight-charts@4.2.0 (weekly K-chart canvas), react-rnd@10.4.14 (draggable/resizable floating windows)

## Content Categories

- 平甩功 (Ping Shuai Gong)
- 老人養生 (Senior Wellness)
- 人生哲理 (Life Philosophy)
- 特異功能 (Extraordinary Abilities)
- 前世今生 (Past Lives)
- Hot Topics
- Coding/Workflow
- Stock Analysis

## Epic 1: Core Architecture & Infrastructure

Source: `User/OpenClaw_LkkViber_Epic1_1.1.md`

**Sprint 1 – Duration:** 2 weeks
**Goal:** Establish a secure, modular foundation that enables all subsequent epics.

### J1.1 – Monorepo Structure

**Status:** ✅ Implemented (Phase 1)

**Acceptance Criteria:**
- Folder tree matches PRD: `backend/`, `frontend/`, `docker/`, `scripts/`, `data/`, `tests/`, `docs/`
- `backend/requirements.txt` includes FastAPI, SQLAlchemy, Pydantic, python-dotenv, loguru, etc.
- `frontend/package.json` includes Next.js 14, React 18, TailwindCSS
- `docker/` contains `app.Dockerfile`, `worker.Dockerfile`, `docker-compose.yml` _(planned)_

---

### J1.2 – Docker Sandbox for MacBook

**Status:** 🔲 Planned (Phase 1 — local Mac deployment, not Replit)

**Acceptance Criteria:**
- `docker-compose.yml` defines exactly five services: `app`, `worker`, `postgres`, `redis`, `ffmpeg`
- `app` and `worker` share the same base image (Python 3.11)
- `ffmpeg` uses `jrottenberg/ffmpeg` or a custom image with ffmpeg installed
- Volume mounts: `./data:/data` and `./assets:/assets` only — **no host root mounts** (e.g., no `/:/host`)
- All containers run in a user-defined Docker network (isolated from host)
- Each service includes a health check
- Secrets are loaded exclusively from `.env` — never hardcoded

**Docker Compose Services:**

| Service | Image | Role | Ports |
|---------|-------|------|-------|
| `app` | `python:3.11` (custom) | FastAPI API server | 8000 |
| `worker` | `python:3.11` (custom) | Background task worker (RQ) | — |
| `postgres` | `postgres:15` | Primary database | 5432 |
| `redis` | `redis:7` | Task queue + caching | 6379 |
| `ffmpeg` | `jrottenberg/ffmpeg` | Media processing service | — |

**Volume Strategy:**
```
./data    → /data     (knowledge base, transcripts — read-write)
./assets  → /assets   (generated media — read-write)
```
No other host directories are mounted. This protects the MacBook from agent filesystem access.

**Replit Note:** On Replit, PostgreSQL is provided by the built-in database (see `DATABASE_URL`). Redis is declared in requirements but optional until the workflow engine (Epic 2) is active. The Docker Compose config is intended for local MacBook production deployment.

---

### J1.3 – Environment & Secrets Management

**Status:** ✅ Implemented (Phase 1)

**Acceptance Criteria:**
- `.env.example` lists all required keys: `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, `MINIMAX_API_KEY`
- Backend loads variables via `pydantic-settings` (`backend/app/core/config.py`)
- Startup validates required keys; missing keys log a clear error
- No secrets are hardcoded in any source file

**Required env vars:**

| Variable | Required | Source |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Auto-set by Replit / Docker postgres |
| `REDIS_URL` | No (Epic 2+) | Docker redis / external |
| `SECRET_KEY` | Yes | Set manually |
| `OPENAI_API_KEY` | No | Optional AI provider |
| `ANTHROPIC_API_KEY` | No | Optional AI provider |
| `DEEPSEEK_API_KEY` | No | Cost-effective Chinese LLM |
| `MINIMAX_API_KEY` | No | Cost-effective TTS/video |

---

### J1.4 – Centralized Logging

**Status:** ✅ Implemented (Phase 1)

**Acceptance Criteria:**
- Structured logs with: timestamp, level, message, module, trace_id
- Log rotation: 100 MB max per file, 7 days retention
- Both `app` and `worker` services use the same logging format
- Logs written to stdout (for Docker) and to `backend/logs/openclaw.log`

**Implementation:** `backend/app/core/logging.py` uses `loguru` with two sinks — coloured stdout for development and a rotating file sink for persistence.

---

### J1.5 – Base README & Setup Script

**Status:** ✅ Partially implemented (Phase 1)

**Acceptance Criteria:**
- `README.md` explains project, prerequisites, and setup steps ✅
- `./scripts/setup.sh` _(planned)_ is executable and:
  - Checks Docker is installed and running
  - Checks ports 8000, 5432, and 6379 are available
  - Creates `.env` from `.env.example` if not present
  - Runs `docker-compose up -d` and waits for services to become healthy
  - Runs database migrations (`alembic upgrade head`)
  - Prints success message with backend and dashboard URLs

**Replit alternative:** `run.sh` serves the same role for the Replit environment — starts the FastAPI backend (port 3001) and Next.js frontend (port 5000) in a single workflow without Docker.

---

### Sprint 1 Success Metrics

| Metric | Target | Replit status |
|--------|--------|---------------|
| All 5 stories implemented | ✅ | ✅ (J1.2 Docker planned for Mac) |
| `./scripts/setup.sh` runs on clean machine | Docker only | `run.sh` covers Replit |
| `docker-compose ps` all containers healthy | Docker only | Replit built-in DB used |
| `GET /health` returns `{"status": "ok"}` | ✅ | ✅ (port 3001) |
| Dashboard accessible | `localhost:3000` | `localhost:5000` on Replit |

---

## GitHub Skill

Source: `User/github_skill.md` · Implementation: `skills/github/SKILL.md`

The GitHub Skill is a core OpenClaw module (Phase 1, Epic 1 / J1.1) that lets the AI agent interact directly with the GitHub API — enabling issue management, PR automation, CI/CD monitoring, asset search, and Gist integration. It converts the agent from a passive assistant into an actionable development partner.

### Required Secret

| Variable | Purpose | How to set |
|----------|---------|-----------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | GitHub → Settings → Developer settings → Fine-grained tokens. Required scopes: `repo`, `issues`, `pull_requests`, `actions`, `gists`. Add as a Replit secret. |

### Five Capability Areas

| # | Capability | Phase | Epic / Jobs | Files |
|---|-----------|-------|-------------|-------|
| 1 | **Issue & Project Management** — search, create, update, close Issues | Phase 1 | Epic 1 (J1.1, J1.5) | `skills/github/issues.py` _(planned)_ |
| 2 | **PR Automation** — check PR status, summarise changes, code review, merge | Phase 1–2 | Epic 1 (J1.5), Epic 2 (J2.3) | `skills/github/pull_requests.py` _(planned)_ |
| 3 | **CI/CD Monitoring** — view Actions run status and logs, diagnose failures | Phase 1 | Epic 1 (J1.1) | `.github/workflows/ci.yml`, `skills/github/actions.py` _(planned)_ |
| 4 | **Asset Management** — search repo data, view releases, list collaborators | Phase 2 | Epic 3 (J3.1) | `skills/github/assets.py` _(planned)_ |
| 5 | **Gist Integration** — publish code snippets as shareable GitHub Gists | Phase 3 | Epic 4 (J4.x) | `skills/github/gists.py` _(planned)_ |

### CI/CD Workflows

| File | Trigger | Purpose |
|------|---------|---------|
| `.github/workflows/ci.yml` | Pull request → `main`; push → `main` | Python 3.11 lint (flake8) + backend import smoke test + Node.js 20 frontend build |
| `.github/workflows/deploy.yml` | Manual (`workflow_dispatch`) | Stub: documents the planned auto-deploy path to Replit via Deploy API |

### Use Cases

| Use Case | Phase | Description |
|----------|-------|-------------|
| **Autonomous Issue Diagnosis** | Phase 1–2 | On error report, agent checks Issues, retrieves code, and suggests a fix |
| **Code Quality Gatekeeper** | Phase 2 | Auto-reviews new PRs for standards and security; generates summary |
| **Automated Doc Generation** | Phase 2–3 | On code change, auto-updates README or `docs/` in the repo |
| **24/7 Ops Assistant** | Phase 3–5 | Periodically checks stale Issues and pings developers |
| **Cross-Platform Control** | Phase 5 | Accepts commands via Telegram/WhatsApp/Discord to operate on GitHub |

---

## Epic 6: Stock Engine (ST125 / 102.5 Theory)

Source: `User/ST125_2.pdf`, `User/ST125.pdf`

**Status:** ✅ Phase 1 Built

### Theory Overview

ST125 uses weekly SMA crossovers + slope direction + Parabolic SAR to classify stocks into **6 phases / 28 sub-phases** (per `User/ST125_phase.md`).

**MA Equivalences (weekly ↔ daily):**
| Weekly | Daily | Period |
|--------|-------|--------|
| W2 | D10 | ~2 weeks = 10 daily bars |
| W10 | D50 | ~10 weeks = 50 daily bars |
| W26 | D132 | ~26 weeks = half-year |
| W52 | D260 | ~52 weeks = 1 year |

**Classification inputs:**
- MA values: W2, W10, W26, W52 (SMA on weekly bars)
- MA slopes: percentage change per period
- SAR signal: "low" (SAR < close = bullish support), "high" (SAR > close = bearish pressure)
- Crossover events: W2 XO W10, W10 XO W26, etc. (lookback 3 bars)
- Additional: slope acceleration (B2/D2/B4/D4), SAR for B3/D3

### 28 Sub-Phases & Scores

**Phase X – Correction / Bottoming** (🎯 Entry zone)
| Phase | MA Ordering | Conditions | SAR | Score |
|-------|-------------|------------|-----|-------|
| **X2** | W52>W26>W10 | W52/W26 neg, W2 XO W10 | low | **94** |
| **X1** | W52>W26>W10 | W52/W26/W10 neg, W2 XO W10 | — | **88** |
| **X3** | W52>W10>W26 | W52/W26 neg, W2>W10 | — | **79** |
| **X4** | W52>W10>W26 | W52 neg, W2 slope+ | — | **72** |
| **X5** | W10>W52>W26 | W52 neg | — | **67** (=A3) |

**Phase A – Adaptation / Uptrend Start** (📈 Entry zone)
| Phase | MA Ordering | Conditions | SAR | Score |
|-------|-------------|------------|-----|-------|
| **A1** | W52>W26, W10 XO W26 | W52/W26 neg | low | **82** |
| **A2** | W52>W10>W26 | W52 neg | low | **75** |
| **A3** | W10>W52>W26 | W52 neg | — | **67** |
| **A4** | W10>W26>W52 | W52 pos | — | **58** |
| **A5** | W26>W10>W52 | W52 pos | — | **50** |

**Phase B – Overheating / Bull Peak** (⚠️ Caution zone)
| Phase | MA Ordering | Conditions | SAR | Score |
|-------|-------------|------------|-----|-------|
| **B1** | W10>W26>W52 | All pos | — | **40** |
| **B4** | W10>W26>W52 | All pos, W10 slope decelerating | — | **36** |
| **B2** | W10>W26>W52 | All pos, W10 slope accelerating | — | **32** |
| **B3** | W10>W26>W52 | All pos | high | **27** |

**Phase Y – Correction / Top** (🚪 Exit zone)
| Phase | MA Ordering | Conditions | SAR | Score |
|-------|-------------|------------|-----|-------|
| **Y1** | W10>W26>W52 | All pos, W2 UN W10 | — | **15** |
| **Y4** | W26>W10>W52 | W52 pos | — | **13** |
| **Y3** | W26>W10>W52 | W52/W26 pos, W2<W10 | — | **11** |
| **Y2** | W10>W26>W52 | W52/W26 pos, W2 UN W10 | high | **8** |
| **Y5** | W10<W52<W26 | W52 pos | — | **18** (=C3) |

**Phase C – Adaptation / Downtrend** (📉 Bearish zone)
| Phase | MA Ordering | Conditions | SAR | Score |
|-------|-------------|------------|-----|-------|
| **C1** | W52<W26, W10 UN W26 | W52/W26 pos | high | **22** |
| **C2** | W52<W10<W26 | W52 pos | high | **20** |
| **C3** | W10<W52<W26 | W52 pos | — | **18** |
| **C4** | W10<W26<W52 | W52 neg | — | **15** |
| **C5** | W26<W10<W52 | W52 neg | — | **12** |

**Phase D – Overheating / Bear Bottom** (💀→🌱 Watch zone)
| Phase | MA Ordering | Conditions | SAR | Score |
|-------|-------------|------------|-----|-------|
| **D3** | W10<W26<W52 | All neg | low | **42** |
| **D4** | W10<W26<W52 | All neg, W10 slope flattening | — | **38** |
| **D2** | W10<W26<W52 | All neg, W10 slope accelerating↓ | — | **35** |
| **D1** | W10<W26<W52 | All neg | — | **30** |

**Entry triggers:** X1–X4, A1–A2 (🎯)
**Exit triggers:** Y1–Y4, C1–C2 (🚪)
**Note:** X5 = A3 (same MA conditions); Y5 = C3 (same MA conditions)

### Watchlists

**Taiwan (TW):** Top 100 stocks by daily volume × avg(OHLC) in NT$ 100M. Data via yfinance `.TW` suffix.

**US:** S&P 500 top 100 by dollar volume + forced Big 7 (AAPL, MSFT, GOOGL, AMZN, META, NVDA, TSLA) + TSM.

### Schedule (Phase 1)

| Market | Analysis Time | UTC |
|--------|-------------|-----|
| TW | After 14:00 Taipei (UTC+8) | 06:00 UTC |
| US | After 17:00 ET | 22:00 UTC |

### File Map

```
backend/app/services/stock_engine/
├── __init__.py           # Exports all classes
├── data_fetcher.py       # J6.1 — yfinance OHLCV, TW/US watchlists
├── ma_calculator.py      # J6.2 — W2/W10/W26/W52 SMA, slopes, SAR
├── phase_classifier.py   # J6.3 — 14 sub-phase rules from ST125_2.pdf
├── scorer.py             # J6.4 — base scores + volume/slope bonuses
├── ranker.py             # J6.4 — full pipeline, top-N ranking
├── report_generator.py   # J6.5 — Markdown + Telegram delivery
└── scheduler.py          # J6.5 — daily cron (06:00 TW, 22:00 US)

backend/app/api/v1/stock.py
  GET  /api/v1/stock/signals          — list signals (filter by market/date/phase)
  GET  /api/v1/stock/signals/latest   — most recent day's top signals
  GET  /api/v1/stock/signals/history  — phase history for one symbol
  GET  /api/v1/stock/live             — real-time analysis (no DB save)
  POST /api/v1/stock/run-analysis     — sync full-market run + DB save
  POST /api/v1/stock/run-analysis/async — background trigger
  GET  /api/v1/stock/report/latest    — latest markdown report content
  GET  /api/v1/stock/phases/legend    — phase scoring legend
```

### Additional Environment Variables

| Variable | Purpose |
|----------|---------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for daily signal delivery |
| `TELEGRAM_CHAT_ID` | Target chat/channel ID |
| `FINMIND_API_TOKEN` | FinMind TW data API (optional, free tier) |

---

## User Documents

Planning and PRD documents are in `User/`:
- `OpenClaw_LkkViber_PRD_1.1.md` – Full product requirements
- `OpenClaw_for_replit_joblist_1.1.md` – Job tickets by Epic
- `OpenClaw_implementation_Plan.md` – Implementation roadmap
- `Fundamental_usecase_and_skills.md` – Defines the 10 fundamental AI skills, 3 operational protocols, and 7 core use cases with their phase mapping
- `github_skill.md` – GitHub Skill capability specification (Chinese) — source for `skills/github/SKILL.md`

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
