# GitHub Skill

Source: `User/github_skill.md`

The GitHub Skill is a core module that lets the OpenClaw AI agent interact
directly with the GitHub API — turning it from a static chat assistant into an
actionable development automation partner. It is activated through YAML
configuration and natural-language commands.

---

## Required Secret

| Variable | Scope | How to set |
|----------|-------|-----------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | Generate at GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens. Add as a Replit secret named `GITHUB_TOKEN`. Required scopes: `repo`, `issues`, `pull_requests`, `actions`, `gists`. |

---

## Capability 1 – Issue & Project Management

**Phase:** 1 (Month 1) · **Epic:** 1 (J1.1, J1.5)

Search, create, update, and close GitHub Issues programmatically.

**Natural-language commands:**
- "Search for all open issues labelled `bug` in the repo"
- "Create a new issue titled 'Stock refresh job fails silently' with label `bug`"
- "Close issue #42 with comment 'Fixed in commit abc1234'"
- "List all issues assigned to me that are overdue"

**Implementation file:** `skills/github/issues.py` _(planned)_

---

## Capability 2 – PR Automation

**Phase:** 1–2 · **Epic:** 1 (J1.5), Epic 2 (J2.3)

Check Pull Request status, summarise changes, perform code review, and execute merges.

**Natural-language commands:**
- "Summarise the changes in PR #15"
- "Review PR #15 for security vulnerabilities and coding standard violations"
- "Merge PR #15 if all checks pass"
- "List all open PRs waiting for my review"

**Implementation file:** `skills/github/pull_requests.py` _(planned)_

---

## Capability 3 – CI/CD Monitoring

**Phase:** 1 · **Epic:** 1 (J1.1)

View GitHub Actions workflow run status and logs; diagnose build failures.

**Natural-language commands:**
- "Show the last 5 workflow runs on the main branch"
- "Why did the CI workflow fail on PR #15?"
- "Re-run the failed jobs on workflow run #890"
- "Watch the deploy workflow and notify me when it completes"

**Implementation file:** `skills/github/actions.py` _(planned)_

**Local CI/CD files:**
- `.github/workflows/ci.yml` — runs on every PR to main
- `.github/workflows/deploy.yml` — manual trigger, planned auto-deploy

---

## Capability 4 – Asset Management

**Phase:** 2 · **Epic:** 3 (J3.1)

Search repository data, view releases, and list collaborators.

**Natural-language commands:**
- "Search the repo for all files containing `StockSignal`"
- "List all releases and their change notes"
- "Who are the current collaborators on this repo?"
- "What is the latest release version?"

**Implementation file:** `skills/github/assets.py` _(planned)_

---

## Capability 5 – Gist Integration

**Phase:** 3 · **Epic:** 4 (J4.x)

Convert code snippets into shareable GitHub Gists instead of dumping long
code blocks into a chat window.

**Natural-language commands:**
- "Create a Gist from the MA-crossover calculation function"
- "List my last 10 Gists"
- "Update Gist abc123 with the latest version of the stock signal script"
- "Share the Gist link for the video pipeline helper"

**Implementation file:** `skills/github/gists.py` _(planned)_

---

## Use Cases

| Use Case | Phase | Description |
|----------|-------|-------------|
| **Autonomous Issue Diagnosis** | Phase 1–2 | On error report, OpenClaw checks related Issues, retrieves existing code, and suggests a fix PR |
| **Code Quality Gatekeeper** | Phase 2 | Auto-reviews new PRs for standards compliance and security; generates a human-readable summary |
| **Automated Doc Generation** | Phase 2–3 | On codebase change, auto-updates README or `docs/` content in the GitHub repo |
| **24/7 Ops Assistant** | Phase 3–5 | Periodically checks for stale Issues and pings developers; integrates with the morning brief |
| **Cross-Platform Control** | Phase 5 | Accepts commands via WhatsApp/Telegram/Discord to operate on GitHub without opening a browser |

---

## YAML Configuration Template

```yaml
# skills/github/config.yml (planned)
skill: github
version: "1.0"
token_env: GITHUB_TOKEN
default_repo: "owner/openclaw"
capabilities:
  issues:      enabled: true
  pull_requests: enabled: true
  actions:     enabled: true
  assets:      enabled: true
  gists:       enabled: true
rate_limit_buffer_pct: 20
```
