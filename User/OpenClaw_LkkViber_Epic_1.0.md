# 🧩 1. Epic 分解（從 PRD → 可執行結構）

Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-03-28 | 0.99.0 | Initial Idea | LKK Viber |
| 2026-03-29 | 1.00.0 | Created by BMAD Method | BMAD PM agent |

---

## 🟦 Epic 1 — Core Architecture & Infrastructure

👉 系統骨架（最重要）

### Goals

- 建立 monorepo
- Docker sandbox
- 基本服務可跑

### Stories

- E1-S1: 建立 monorepo structure
- E1-S2: Docker Compose（app + worker + db + redis）
- E1-S3: env / secrets 管理
- E1-S4: logging system
- E1-S5: base README + setup script

---

## 🟩 Epic 2 — Workflow Engine（核心大腦）

👉 所有自動化的核心

### Stories

- E2-S1: 任務 queue（Redis + worker）
- E2-S2: job model（status / retry）
- E2-S3: workflow definition（JSON / YAML）
- E2-S4: scheduler（cron / trigger）
- E2-S5: workflow API（FastAPI）

---

## 🟨 Epic 3 — Content Engine（AI 腳本引擎）

### Stories

- E3-S1: topic collector（DB + API）
- E3-S2: script generator（prompt template）
- E3-S3: multi-language support
- E3-S4: hook / CTA generator
- E3-S5: version control（script history）

---

## 🟥 Epic 4 — Video Pipeline（影片自動化）

### Stories

- E4-S1: TTS service wrapper
- E4-S2: image/video prompt generator
- E4-S3: ffmpeg pipeline
- E4-S4: subtitle generator
- E4-S5: format exporter（9:16 / 1:1）

---

## 🟪 Epic 5 — Publishing Hub

### Stories

- E5-S1: YouTube uploader
- E5-S2: Telegram publisher
- E5-S3: metadata mapping system
- E5-S4: publish status tracking
- E5-S5: manual fallback uploader UI

---

## 🟫 Epic 6 — Stock Engine

### Stories

- E6-S1: TW/US data fetcher
- E6-S2: MA 計算
- E6-S3: crossover detection
- E6-S4: ranking logic
- E6-S5: daily report generator

---

## ⬛ Epic 7 — Admin Dashboard

### Stories

- E7-S1: basic UI（Next.js）
- E7-S2: job monitor
- E7-S3: script editor
- E7-S4: publish dashboard
- E7-S5: stock dashboard

---

## 🟧 Epic 8 — Story Engine（前世今生）

### Stories

- E8-S1: story bible schema
- E8-S2: episode generator
- E8-S3: character system
- E8-S4: storyboard generator

---

---

# 🔥 2. Replit Priority Job List（最重要）

👉 這是你「消耗 token + 建立資產」的核心

我幫你分成 3 層：

---

## 🥇 Tier 1（必做 / 高 Token ROI）

這些是 **最值得用 Replit 的**

### 🔥 R1. OpenClaw Master Repo Generator

- 自動生成：
    - folder structure
    - base modules
    - README
- 👉 高反覆優化 → 吃 token

---

### 🔥 R2. Workflow Engine Builder（超關鍵）

- 任務 queue
- job schema
- retry system
- DAG workflow

👉 這是整個系統「大腦」

---

### 🔥 R3. Script Generator System

- prompt library
- 多語言 script
- hook / CTA

👉 直接產生內容價值

---

### 🔥 R4. Video Packaging Engine

- title
- description
- hashtags
- SEO

👉 可重複用，長期價值高

---

### 🔥 R5. AI Video Pipeline（ffmpeg + TTS）

- 自動生成影片
- 多格式輸出

👉 token 消耗大但產出最大

---

### 🔥 R6. Multi-platform Publisher Core

- YouTube API
- Telegram bot
- metadata mapping

👉 讓內容變現

---

## 🥈 Tier 2（中期）

### R7. Topic Research Scraper

### R8. Long video → shorts pipeline

### R9. Admin Dashboard（React）

### R10. Stock signal engine

---

## 🥉 Tier 3（後期）

### R11. Story engine（前世今生）

### R12. Analytics dashboard

### R13. Prompt library system

### R14. RAG knowledge base

---

---

# 🗓️ 3. Sprint 規劃（5 個月實戰版）

👉 每個 Sprint = 2 週

---

## 🟢 Month 1（Sprint 1–2）

👉 打地基

### Sprint 1

- repo structure
- Docker setup
- FastAPI base

### Sprint 2

- workflow engine v1
- job queue
- basic API

---

## 🔵 Month 2（Sprint 3–4）

👉 開始產內容

### Sprint 3

- script generator
- topic collector

### Sprint 4

- video packaging
- metadata engine

---

## 🟣 Month 3（Sprint 5–6）

👉 自動產影片

### Sprint 5

- TTS + image pipeline

### Sprint 6

- ffmpeg assembly
- subtitle system

---

## 🟠 Month 4（Sprint 7–8）

👉 發布 + 股票

### Sprint 7

- YouTube + Telegram publish
- dashboard v1

### Sprint 8

- stock engine
- daily report

---

## 🔴 Month 5（Sprint 9–10）

👉 擴展與優化

### Sprint 9

- story engine
- analytics

### Sprint 10

- provider routing
- cost optimization
- system stabilization

---

# ⚡ 最重要結論（給你決策）

如果你只能做「最關鍵 5 個」：

👉 請優先：

1. Workflow Engine
2. Script Generator
3. Video Pipeline
4. Publishing Hub
5. Docker Sandbox

---

# 🚀 下一步（我建議）

如果你要進「真正 build 階段」：

👉 我可以幫你做：

### ✅ 1. 每個 Replit Job → Prompt（可直接丟）

### ✅ 2. Monorepo folder structure（直接可用）

### ✅ 3. 第一個 Sprint 完整任務卡（Jira style）

只要回我：

👉 **「做 Sprint 1 任務卡 + Replit prompts」**

我會直接幫你變成可以開工的版本。