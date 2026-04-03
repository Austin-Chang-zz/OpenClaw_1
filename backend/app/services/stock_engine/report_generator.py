"""
J6.5 – Daily Report Generator
Produces:
  - Markdown report saved to data/stock_reports/
  - Telegram message (Phase 1)
  - Matplotlib MA chart per top stock (optional)
Disclaimer: Not financial advice.
"""

import io
import logging
import os
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)

DISCLAIMER = (
    "\n\n⚠️ *Disclaimer: This report is for informational purposes only and "
    "does not constitute financial advice. All investments carry risk. "
    "Do your own research before making any investment decisions.*"
)

PHASE_EMOJI = {
    "X1": "🟢", "X2": "💚",
    "A1": "📈", "A2": "📈", "A3": "📊", "A4": "📊", "A5": "📊",
    "B1": "⚠️", "B2": "🔴",
    "Y1": "🔻", "Y2": "⛔",
    "C1": "📉", "C2": "📉", "C3": "📉", "C4": "📉", "C5": "📉",
    "D1": "💀", "D2": "💀",
    "MIXED": "❓", "UNKNOWN": "❔",
}

REPORT_DIR = Path("data/stock_reports")


class ReportGenerator:

    def __init__(self):
        REPORT_DIR.mkdir(parents=True, exist_ok=True)

    def generate_markdown(
        self,
        tw_signals: List[Dict[str, Any]],
        us_signals: List[Dict[str, Any]],
        report_date: Optional[date] = None,
    ) -> str:
        report_date = report_date or date.today()
        lines = [
            f"# ST125 Daily Stock Report — {report_date}",
            "",
            "> ST125 theory: MA2/MA10/MA26/MA52 crossover + pivot + SAR signals.",
            "> Phases: X (bottom) → A (bull rise) → B (peak) → Y (top) "
            "→ C (bear fall) → D (bottom).",
            "",
        ]

        for market, signals, flag in [("🇹🇼 Taiwan (TW)", tw_signals, "TW"),
                                       ("🇺🇸 United States (US)", us_signals, "US")]:
            lines += [f"## {market} — Top {len(signals)} Opportunities", ""]
            if not signals:
                lines += ["*No signals available.*", ""]
                continue
            lines += [
                "| Rank | Symbol | Phase | Score | Close | Vol 100M | SAR | Signal |",
                "|------|--------|-------|-------|-------|----------|-----|--------|",
            ]
            for i, s in enumerate(signals, 1):
                emoji = PHASE_EMOJI.get(s.get("phase_label", ""), "❔")
                vol = f"{s.get('volume_amount_100m', 0):.1f}"
                entry_flag = " 🎯" if _is_entry(s.get("phase_label", "")) else ""
                exit_flag = " 🚪" if _is_exit(s.get("phase_label", "")) else ""
                lines.append(
                    f"| {i} | **{s['symbol']}** | {emoji} {s.get('phase_label','')} "
                    f"| {s.get('phase_score', 0):.1f} "
                    f"| {s.get('close_price', 0):.2f} "
                    f"| {vol} "
                    f"| {s.get('sar_signal','?')} "
                    f"|{entry_flag}{exit_flag} |"
                )
            lines += [""]

            for s in signals[:5]:
                lines += [
                    f"### {s['symbol']} ({s.get('phase_label','')})",
                    f"_{s.get('explanation', '')}_",
                    f"- W2={_fmt(s,'w2')} W10={_fmt(s,'w10')} "
                    f"W26={_fmt(s,'w26')} W52={_fmt(s,'w52')}",
                    f"- Slope W10: {s.get('slope_w10', 0):.3f}% | "
                    f"SAR: {s.get('sar_signal','?')} | "
                    f"Crossover: {s.get('crossover_event','—') or '—'}",
                    "",
                ]

        lines.append(
            "\n---\n*⚠️ Not financial advice. For informational purposes only.*"
        )
        return "\n".join(lines)

    def generate_telegram_message(
        self,
        signals: List[Dict[str, Any]],
        market: str,
        report_date: Optional[date] = None,
    ) -> str:
        report_date = report_date or date.today()
        market_name = "🇹🇼 Taiwan" if market == "TW" else "🇺🇸 US"
        lines = [
            f"*ST125 Daily — {market_name} — {report_date}*",
            "",
        ]
        for i, s in enumerate(signals, 1):
            emoji = PHASE_EMOJI.get(s.get("phase_label", ""), "❔")
            entry = " 🎯" if _is_entry(s.get("phase_label", "")) else ""
            lines.append(
                f"{i}\\. *{s['symbol']}* {emoji}{s.get('phase_label','')} "
                f"\\| score {s.get('phase_score',0):.0f} "
                f"\\| close {s.get('close_price',0):.2f}{entry}"
            )
        lines.append(DISCLAIMER)
        return "\n".join(lines)

    def save_report(self, content: str, market: str, report_date: Optional[date] = None) -> Path:
        report_date = report_date or date.today()
        filename = REPORT_DIR / f"st125_{market}_{report_date}.md"
        filename.write_text(content, encoding="utf-8")
        logger.info(f"Report saved to {filename}")
        return filename

    async def send_telegram(
        self,
        message: str,
        token: Optional[str] = None,
        chat_id: Optional[str] = None,
    ) -> bool:
        token = token or os.getenv("TELEGRAM_BOT_TOKEN")
        chat_id = chat_id or os.getenv("TELEGRAM_CHAT_ID")
        if not token or not chat_id:
            logger.warning("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set; skipping send")
            return False
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "MarkdownV2",
            "disable_web_page_preview": True,
        }
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    logger.info("Telegram message sent successfully")
                    return True
                logger.error(f"Telegram send failed: {resp.status_code} {resp.text}")
                return False
        except Exception as e:
            logger.error(f"Telegram send error: {e}")
            return False


def _fmt(sig: Dict, key: str) -> str:
    v = sig.get(key)
    return f"{v:.2f}" if v is not None else "—"


def _is_entry(phase: str) -> bool:
    return phase in {"X1", "X2", "A1", "A2"}


def _is_exit(phase: str) -> bool:
    return phase in {"Y1", "Y2", "C1", "C2"}
