# OpenClaw – Replit Job List v1.1 (PRD-Aligned)

This job list is structured according to the **10 Epics** defined in `OpenClaw_LkkViber_PRD_1.1.md`.  
Each job corresponds to a user story and includes a brief description, priority (High/Medium/Low), and estimated effort (S/M/L).

Use this list to generate Replit agent prompts and track progress.

---

## Epic 1: Core Architecture & Infrastructure (High Priority)

| Job ID | Story | Description | Priority | Effort |
|--------|-------|-------------|----------|--------|
| J1.1 | 1.1 | **Monorepo Structure** – Create folder tree, base files, and dependency manifests. | High | M |
| J1.2 | 1.2 | **Docker Sandbox** – Docker Compose with app, worker, postgres, redis, ffmpeg containers. | High | L |
| J1.3 | 1.3 | **Environment & Secrets** – .env.example, validation, no hardcoded secrets. | High | S |
| J1.4 | 1.4 | **Centralized Logging** – JSON logs, rotation, structured logging utility. | Medium | M |
| J1.5 | 1.5 | **Setup Script** – One‑command setup (./scripts/setup.sh) with prerequisites check. | Medium | M |

---

## Epic 2: Workflow Engine (High Priority)

| Job ID | Story | Description | Priority | Effort |
|--------|-------|-------------|----------|--------|
| J2.1 | 2.1 | **Task Queue** – Redis + worker, job enqueue/dequeue, retry logic. | High | L |
| J2.2 | 2.2 | **Job Model** – States, input/output metadata, timeout handling. | High | M |
| J2.3 | 2.3 | **Workflow Definition** – JSON/YAML DAG support, validation. | High | L |
| J2.4 | 2.4 | **Scheduler** – Cron triggers, manual trigger API. | High | M |
| J2.5 | 2.5 | **Workflow API** – FastAPI endpoints (create job, status, list workflows). | High | M |

---

## Epic 3: Content Engine (High Priority)

| Job ID | Story | Description | Priority | Effort |
|--------|-------|-------------|----------|--------|
| J3.1 | 3.1 | **Topic Collector** – Manual form + trend scraping, categories, scoring. | High | L |
| J3.2 | 3.2 | **Script Generator** – Multi‑language, tone presets, prompt templates, LLM routing. | High | L |
| J3.3 | 3.3 | **Hook & CTA Generator** – Generate 3 hooks + CTA per script. | Medium | M |
| J3.4 | 3.4 | **Version Control** – Script versions, diff, rollback. | Medium | M |
| J3.5 | 3.5 | **Metadata Packaging** – Title, description, hashtags, thumbnail prompts. | High | M |

---

## Epic 4: Video Pipeline (High Priority)

| Job ID | Story | Description | Priority | Effort |
|--------|-------|-------------|----------|--------|
| J4.1 | 4.1 | **TTS Wrapper** – Multi‑provider adapter (Edge, ElevenLabs, MiniMax), fallback. | High | M |
| J4.2 | 4.2 | **Visual Asset Generator** – Prompt generation, stock asset fallback. | Medium | L |
| J4.3 | 4.3 | **ffmpeg Assembly** – Combine audio + visuals, output 9:16/1:1/16:9. | High | L |
| J4.4 | 4.4 | **Subtitle Burner** – Auto‑transcribe, burn into video, SRT export. | High | M |
| J4.5 | 4.5 | **Format Exporter** – Queue multiple exports from one master. | Medium | M |

---

## Epic 5: Publishing Hub (High Priority)

| Job ID | Story | Description | Priority | Effort |
|--------|-------|-------------|----------|--------|
| J5.1 | 5.1 | **YouTube Uploader** – OAuth2, upload with metadata, schedule. | High | L |
| J5.2 | 5.2 | **Telegram Publisher** – Bot send video to channel/group. | High | M |
| J5.3 | 5.3 | **Metadata Mapping** – Platform‑specific field templates. | Medium | M |
| J5.4 | 5.4 | **Publish Status Tracking** – Dashboard with retry. | Medium | M |
| J5.5 | 5.5 | **Manual Fallback UI** – Download package (video + caption + cover). | Medium | M |

---

## Epic 6: Stock Engine (Medium Priority)

| Job ID | Story | Description | Priority | Effort |
|--------|-------|-------------|----------|--------|
| J6.1 | 6.1 | **Market Data Fetcher** – TW/US data (yfinance, FinMind), daily update. | High | L |
| J6.2 | 6.2 | **MA Calculator** – Weekly 2/10/26, daily 2/10/50/132. | High | M |
| J6.3 | 6.3 | **Crossover & Pivot Detection** – Detect signals, score. | High | L |
| J6.4 | 6.4 | **Ranking Logic** – Rank top 10 TW/US with explanations. | Medium | M |
| J6.5 | 6.5 | **Daily Report Generator** – Markdown/PDF/JSON, charts. | Medium | L |

---

## Epic 7: Admin Dashboard (Medium Priority)

| Job ID | Story | Description | Priority | Effort |
|--------|-------|-------------|----------|--------|
| J7.1 | 7.1 | **Basic UI** – Next.js login, sidebar, responsive. | High | L |
| J7.2 | 7.2 | **Job Monitor** – Real‑time queue view, cancel/retry. | High | M |
| J7.3 | 7.3 | **Script Editor** – WYSIWYG with version history. | Medium | L |
| J7.4 | 7.4 | **Publish Dashboard** – Calendar view, manual publish. | Medium | M |
| J7.5 | 7.5 | **Stock Dashboard** – Display top signals, MA charts. | Medium | M |

---

## Epic 8: Story Engine (Low Priority)

| Job ID | Story | Description | Priority | Effort |
|--------|-------|-------------|----------|--------|
| J8.1 | 8.1 | **Story Bible Schema** – World, characters, timeline. | Low | M |
| J8.2 | 8.2 | **Episode Generator** – 5‑episode arcs from bible. | Low | L |
| J8.3 | 8.3 | **Character Consistency** – Profile for AI. | Low | M |
| J8.4 | 8.4 | **Storyboard Generator** – Scene prompts, camera angles. | Low | L |

---

## Epic 9: Multi‑Language & RWD (Medium Priority)

| Job ID | Story | Description | Priority | Effort |
|--------|-------|-------------|----------|--------|
| J9.1 | 9.1 | **Language Support** – i18n for EN, ZH‑TW, ZH‑CN, JA, ES, RTL. | High | L |
| J9.2 | 9.2 | **Language Switcher** – UI toggle, persist preference. | Medium | S |
| J9.3 | 9.3 | **Responsive Design** – No horizontal scroll, touch‑friendly. | High | M |

---

## Epic 10: Advanced Notifications & Security (Low Priority)

| Job ID | Story | Description | Priority | Effort |
|--------|-------|-------------|----------|--------|
| J10.1 | 10.1 | **Push Notifications** – Browser push for job events. | Low | M |
| J10.2 | 10.2 | **Parental Controls** – Approval flow (future extension). | Low | L |
| J10.3 | 10.3 | **Data Security** – GDPR/CCPA readiness, encrypted secrets. | Medium | M |

---

## How to Use This Joblist

1. **Select a job** from the list.
2. **Convert into a Replit agent prompt** – e.g., *“Implement Job J1.1: Create a monorepo with the structure defined in PRD, add FastAPI backend, Next.js frontend, and Docker Compose files.”*
3. **Track progress** – Mark as done after acceptance criteria are met.
4. **Prioritize** – Start with **High Priority** jobs in Epic 1, 2, 3, 4, 5.

---

*Generated from OpenClaw PRD v1.1 – 2026-03-31*