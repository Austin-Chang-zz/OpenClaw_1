在 OpenClaw (一個開源的本地 AI 代理框架) 中，GitHub Skill 是一個核心模組，旨在讓 AI 代理能夠直接與 GitHub API 互動，將靜態聊天機器人轉變為具備「行動力」的自動化開發助手。 [1, 2, 3] 
## 主要功能 (Features)
GitHub Skill 透過 YAML 設定檔與自然語言指令，賦予 OpenClaw 以下能力： [2, 4, 5, 6] 

* 議題與專案管理：搜尋、建立、更新、關閉 Issues。
* PR 自動化：檢查 Pull Requests 狀態、總結變更內容、進行程式碼審查 (Code Review) 或執行合併。
* CI/CD 監控：查看 GitHub Actions 的工作流運行狀態及日誌，診斷失敗原因。
* 資產管理：搜尋儲存庫數據、查看版本發佈 (Releases) 或列出協作者。
* Gist 整合：將程式碼片段轉換為 GitHub Gist 分享，而非在聊天視窗中顯示冗長代碼。 [4, 5, 7, 8, 9] 

## 應用場景 (Use Cases)

* 自主 Issue 診斷：當收到錯誤回報時，OpenClaw 可以自動檢查相關 Issue，拉取現有代碼並建議修復方案。
* 程式碼品質守門員：自動對新提交的 PR 進行初步審查，檢查是否符合規範或存在安全漏洞，並產出摘要。
* 自動化文件生成：根據代碼庫的變更，自動更新 GitHub 上的 README 或專案文件。
* 全天候維運助手：結合 OpenClaw 的 Always-on (持續運行) 特性，定時檢查過期 Issue 並自動提醒開發者。
* 跨平台協作：透過 WhatsApp 或 Telegram 等通訊工具，遠端指令 OpenClaw 在 GitHub 上執行操作，無需打開網頁介面。 [5, 9, 10, 11, 12] 

您是否想了解如何安裝特定的 GitHub Skill，或是需要特定的 YAML 配置範例？

[1] [https://github.com](https://github.com/rohitg00/awesome-openclaw)
[2] [https://skywork.ai](https://skywork.ai/skypage/en/openclaw-github-skills/2038546878825316352#:~:text=At%20its%20core%2C%20an%20OpenClaw%20skill%20is,to%20give%20their%20agent%20%22hands%22%20and%20%22eyes.%22)
[3] [https://skywork.ai](https://skywork.ai/skypage/en/openclaw-github-skills/2038573663533219840)
[4] [https://github.com](https://github.com/openclaw/openclaw/blob/main/skills/github/SKILL.md)
[5] [https://lumadock.com](https://lumadock.com/tutorials/openclaw-github-automation-pr-reviews-ci-monitoring)
[6] [https://github.com](https://github.com/FreedomIntelligence/OpenClaw-Medical-Skills)
[7] [https://github.com](https://github.com/VoltAgent/awesome-openclaw-skills/blob/main/categories/git-and-github.md)
[8] [https://www.dench.com](https://www.dench.com/blog/openclaw-github-integration#:~:text=OpenClaw%27s%20GitHub%20integration%20lets%20you%20manage%20issues%2C,what%20you%20can%20actually%20do%20with%20it.)
[9] [https://zenvanriel.nl](https://zenvanriel.nl/ai-engineer-blog/openclaw-github-pr-review-automation-guide/#:~:text=Read%20only%20access%20eliminates%20these%20risks%20entirely.,human%20action%20based%20on%20the%20AI%20analysis.)
[10] [https://www.mississippiheadwaters.org](https://www.mississippiheadwaters.org/news/?app=openclaw-github-turn-your-machine-into-a-cross-platform-ai-assistant-69ae7c6aace48#:~:text=OpenClaw%20exposes%20a%20flexible%20skills%20and%20plugins,**openclaw%2Dtermux**%20provide%20ready%E2%80%91made%20skills%2C%20templates%2C%20and%20integrations.)
[11] [https://hackmd.io](https://hackmd.io/@BASHCAT/rylaWmGuWe#:~:text=OpenClaw%20%E6%98%AF%E4%B8%80%E5%80%8B%E9%96%8B%E6%BA%90%EF%BC%88MIT%EF%BC%89%E7%9A%84AI%20Agent%20%E6%A1%86%E6%9E%B6%EF%BC%8C%E8%B7%91%E5%9C%A8%E4%BD%A0%E8%87%AA%E5%B7%B1%E7%9A%84%E6%A9%9F%E5%99%A8%E4%B8%8A%E3%80%82%20%E4%BD%A0%E9%80%8F%E9%81%8EWhatsApp%E3%80%81Telegram%20%E6%88%96Discord%20%E8%B7%9F%E5%AE%83%E5%B0%8D%E8%A9%B1%EF%BC%8C%E5%AE%83%E5%8F%AF%E4%BB%A5%E5%B9%AB%E4%BD%A0%E8%AE%80%E4%BF%A1%E3%80%81%E6%8E%92%E6%97%A5%E7%A8%8B%E3%80%81%E8%B7%91%E6%B8%AC%E8%A9%A6%E3%80%81%E6%8E%A7%E5%88%B6%E7%80%8F%E8%A6%BD%E5%99%A8%E2%80%94,%E8%A3%9D%E5%AE%8C%E5%BE%8C%E6%9C%83%E5%9C%A8%E6%9C%AC%E6%A9%9F%E5%95%9F%E5%8B%95%E4%B8%80%E5%80%8BGateway%20%E6%9C%8D%E5%8B%99%EF%BC%88%E9%A0%90%E8%A8%ADport%2018789%EF%BC%89%E3%80%82%20%E9%80%99%E6%98%AF%E6%95%B4%E5%80%8B%E7%B3%BB%E7%B5%B1%E7%9A%84%E6%8E%A7%E5%88%B6%E5%B9%B3%E9%9D%A2%E3%80%82%20%E4%BD%A0%E7%9A%84%E6%89%80%E6%9C%89%E8%A8%AD%E5%AE%9A%E9%83%BD%E5%9C%A8%20~/.openclaw/openclaw.json%20%E9%80%99%E5%80%8B%E6%AA%94%E6%A1%88%E8%A3%A1%E3%80%82)
[12] [https://github.com](https://github.com/openclaw/openclaw)
