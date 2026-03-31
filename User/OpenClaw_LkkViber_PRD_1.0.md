## 1. Product Overview（產品概述）

### 1.1 產品名稱

**OpenClaw_LkkViber**

Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-03-28 | 0.99.0 | Initial Idea | LKK Viber |
| 2026-03-29 | 1.00.0 | Created by BMAD Method | BMAD PM agent |

### 1.2 產品定位

OpenClaw 是一個 **安全、可擴展、AI 驅動的內容生產與研究自動化系統**，專注於：

- AI 短影音生產
- 長篇故事/影集內容開發
- 股票分析與報告生成
- 多平台自動發布
- 本地 Docker 安全執行

### 1.3 目標

在 5 個月內建立一套：

- 可持續內容生產系統
- 可重複利用的 AI pipeline
- 成本優化的多模型架構
- 本地安全可控環境

---

## 2. Problem Statement（問題定義）

目前存在以下核心問題：

### 2.1 內容生產低效率

- 手動製作影片耗時
- 無法規模化產出
- 缺乏標準化流程

### 2.2 工具碎片化

- script、video、publish 分散
- 無統一 workflow
- 難以重複使用

### 2.3 成本不可控

- LLM API 成本高
- 無 provider routing
- 無 cache 機制

### 2.4 安全風險

- AI 可能存取本機資料
- API key 暴露風險
- 無 sandbox

### 2.5 多平台發布困難

- API 支援不一致
- 手動上傳成本高

---

## 3. Target Users（目標使用者）

### 3.1 Primary Users

- 個人內容創作者（YouTube / TikTok）
- 自動化內容經營者
- AI workflow builder

### 3.2 Secondary Users

- 股票分析內容創作者
- 故事/影集創作者
- 自媒體工作室

---

## 4. Core Value Proposition（核心價值）

### 4.1 Build Once, Use Everywhere

一個 script → 多平台內容

### 4.2 AI Automation Engine

從 idea 到 publish 全自動化

### 4.3 Secure by Design

Docker sandbox 保護本機

### 4.4 Cost-Optimized AI Routing

智能選擇 cheapest / best provider

---

## 5. Product Scope（產品範圍）

---

## 5.1 Core Modules

### A. Content Engine（內容引擎）

功能：

- topic 收集
- script 生成
- metadata 生成
- 多語言支援

輸出：

- 短影音 script（30/60/90 秒）
- SEO metadata
- hashtags / CTA

---

### B. Video Pipeline（影音製作）

功能：

- TTS
- 圖像/影片生成
- ffmpeg 合成
- 字幕燒錄

輸出：

- 9:16 / 1:1 / 16:9 影片

---

### C. Workflow Engine（流程引擎）

功能：

- 任務 queue
- 狀態管理
- retry 機制
- scheduler

流程：

```
Idea → Script → Review → Render → Publish
```

---

### D. Publishing System（發布系統）

支援：

- YouTube Shorts
- TikTok
- Instagram Reels
- Telegram
- Website

特性：

- API + semi-auto 混合
- metadata mapping
- 發布狀態追蹤

---

### E. Stock Engine（股票模組）

功能：

- TW / US market data
- MA crossover 計算
- pivot detection
- ranking system

策略：

- Weekly: 2/10/26
- Daily: 2/10/50/132

輸出：

- 每日報告
- 機會清單
- 圖表

---

### F. Story Engine（影集/故事）

功能：

- 世界觀建立
- 劇本生成
- 分集規劃
- storyboard

---

### G. Admin Dashboard（管理後台）

模組：

- Idea inbox
- Script generator
- Render queue
- Publish scheduler
- Stock dashboard
- Analytics

---

## 5.2 System Architecture

### Layer 1: Interface

- Web dashboard
- CMS

### Layer 2: Workflow

- Queue system
- Task scheduler

### Layer 3: AI Services

- LLM
- TTS
- Image/Video generation

### Layer 4: Media

- ffmpeg
- subtitle engine

### Layer 5: Data

- transcripts
- notes
- market data

### Layer 6: Publishing

- platform connectors

---

## 6. Technical Requirements（技術需求）

### 6.1 Backend

- Python FastAPI

### 6.2 Frontend

- Next.js / React

### 6.3 Database

- PostgreSQL / Supabase

### 6.4 Queue

- Redis + Celery/RQ

### 6.5 Media

- ffmpeg

### 6.6 Automation

- Playwright

---

## 6.7 Deployment

### Local（Mac）

- Docker Compose
- sandbox containers

### Containers

- app
- worker
- postgres
- redis
- ffmpeg

---

## 7. Provider Strategy（AI供應策略）

採用 Adapter Pattern：

每個服務可切換：

- text
- TTS
- image
- video
- STT

模式：

- cheap
- balanced
- premium

---

## 8. Key Workflows（關鍵流程）

### 8.1 Short Video Pipeline

1. topic
2. script
3. review
4. TTS
5. visuals
6. ffmpeg
7. subtitle
8. publish

---

### 8.2 Long Video → Shorts

- transcript
- segmentation
- hook detection
- clip generation

---

### 8.3 Stock Report

- data fetch
- indicator calc
- ranking
- report generation

---

## 9. MVP Scope（最小可行產品）

### 必須包含：

1. workflow engine
2. script generator
3. video assembly pipeline
4. basic publishing (YouTube + Telegram)
5. admin dashboard (basic)
6. Docker sandbox

---

## 10. Roadmap（5個月）

### Month 1

- repo + Docker
- workflow engine
- dashboard skeleton

### Month 2

- script generator
- topic collector
- video packaging

### Month 3

- video automation pipeline
- publishing hub
- website

### Month 4

- stock engine

### Month 5

- story system
- analytics
- provider optimization

---

## 11. Risks & Mitigation（風險與控管）

### 11.1 法規/內容風險

### Health

- 加 disclaimer
- human review

### Spiritual

- 以故事形式呈現

### Stock

- 不保證收益
- 明確風險說明

---

### 11.2 技術風險

- API 不穩 → multi-provider
- 成本爆炸 → routing + cache

---

### 11.3 平台風險

- 無 API → semi-auto upload

---

## 12. Success Metrics（成功指標）

### Content

- 每日產出數
- 發布成功率

### Growth

- views
- engagement

### System

- 成本/影片
- 任務成功率

---

## 13. Future Expansion（未來擴展）

- 本地 LLM（Ollama）
- 自動 A/B 測試
- fully autonomous channel
- SaaS 化 OpenClaw

---

# ✅ 結論

OpenClaw v1 的核心是：

👉 **一個安全 + 可擴展 + 低成本的 AI 內容工廠**

並透過：

- workflow automation
- provider routing
- multi-platform publishing

建立長期可複用的內容資產系統。

---

如果你下一步要進 BMad 流程，我建議：

👉 回覆我：

**「下一步：拆 PRD → Epic + Stories」**

我可以幫你直接轉成：

- Epic 分解
- Replit 可用任務清單
- Sprint 規劃 🚀