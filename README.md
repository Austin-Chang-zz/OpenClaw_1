# 🦅 OpenClaw

**Secure, AI-driven content production and research automation system.**

## Features

- **Topic Inbox** – Manage content ideas organized by category (平甩功, 老人養生, 人生哲理, etc.)
- **Script Studio** – Create multilingual video scripts (Traditional Chinese, Simplified Chinese, English)
- **Stock Engine** – Daily stock signals using the 102.5 theory (MA crossovers + pivot points)
- **Job Monitor** – Track background jobs and workflow tasks

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS — port 5000
- **Backend:** Python FastAPI — port 3001
- **Database:** PostgreSQL (Replit built-in)

## Development

```bash
bash run.sh
```

This starts both the backend API (port 3001) and frontend (port 5000).

## API Documentation

FastAPI auto-generates docs at: `http://localhost:3001/docs`

## Project Structure

```
OpenClaw/
├── backend/           # FastAPI Python backend
│   └── app/
│       ├── api/v1/    # REST endpoints (topics, scripts, jobs, stock)
│       ├── core/      # Config, database, logging
│       ├── models/    # SQLAlchemy models
│       └── services/  # Business logic (content, stock, workflow engines)
├── frontend/          # Next.js 14 admin dashboard
│   └── app/
│       ├── page.tsx   # Dashboard home
│       ├── topics/    # Topic inbox
│       ├── scripts/   # Script studio
│       ├── stock/     # Stock engine
│       └── jobs/      # Job monitor
├── scripts/           # Utility scripts
├── data/              # Knowledge base, transcripts, assets
└── User/              # PRD and planning documents
```

## Disclaimer

Stock signals are for research purposes only. Not financial advice.
