"""
J6.4 – Stock Ranker
Runs the full analysis pipeline for a watchlist and returns ranked results.
TW: Top 10 ranked by phase_score.
US: Big 7 + TSM always shown first (regardless of phase), then top 10 from rest.
"""

import logging
from datetime import date, datetime
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from .data_fetcher import StockDataFetcher
from .ma_calculator import MACalculator
from .phase_classifier import PhaseClassifier
from .scorer import PhaseScorer

logger = logging.getLogger(__name__)

# ── Stock name lookup tables ──────────────────────────────────────────────────
# TW: Chinese names; US: English short names.
# Used to populate stock_name without extra yfinance info calls.

TW_NAMES: Dict[str, str] = {
    "2330.TW": "台積電",
    "2317.TW": "鴻海",
    "2454.TW": "聯發科",
    "2382.TW": "廣達",
    "2308.TW": "台達電",
    "3711.TW": "日月光投控",
    "2881.TW": "富邦金",
    "2882.TW": "國泰金",
    "2886.TW": "兆豐金",
    "2891.TW": "中信金",
    "2884.TW": "玉山金",
    "2885.TW": "元大金",
    "2892.TW": "第一金",
    "5880.TW": "合庫金",
    "2603.TW": "長榮",
    "2615.TW": "萬海",
    "2609.TW": "陽明",
    "2610.TW": "華航",
    "2618.TW": "長榮航",
    "2301.TW": "光寶科",
    "2303.TW": "聯電",
    "2357.TW": "華碩",
    "3034.TW": "聯詠",
    "6505.TW": "台塑石化",
    "1301.TW": "台塑",
    "1303.TW": "南亞",
    "1326.TW": "台化",
    "2002.TW": "中鋼",
    "1101.TW": "台泥",
    "1216.TW": "統一",
    "2912.TW": "統一超",
    "2207.TW": "和泰車",
    "2395.TW": "研華",
    "3008.TW": "大立光",
    "2379.TW": "瑞昱",
    "3231.TW": "緯創",
    "2327.TW": "國巨",
    "2353.TW": "宏碁",
    "2408.TW": "南亞科",
    "2345.TW": "智邦",
    "2337.TW": "旺宏",
    "2376.TW": "技嘉",
    "6669.TW": "緯穎",
    "2356.TW": "英業達",
    "4938.TW": "和碩",
    "2360.TW": "致茂",
    "2201.TW": "裕隆",
    "2105.TW": "正新",
    "1402.TW": "遠東新",
    "1504.TW": "東元",
    "2834.TW": "臺企銀",
    "5871.TW": "中租-KY",
    "2823.TW": "中壽",
    "2880.TW": "華南金",
    "2887.TW": "台新金",
    "2888.TW": "新光金",
    "2889.TW": "國票金",
    "2890.TW": "永豐金",
    "5876.TW": "上海商銀",
    "2801.TW": "彰銀",
    "2371.TW": "大同",
    "2377.TW": "微星",
    "3045.TW": "台灣大",
    "4904.TW": "遠傳",
    "2412.TW": "中華電",
    "3324.TW": "雙鴻",
    "6415.TW": "矽力-KY",
    "3017.TW": "奇鋐",
    "2385.TW": "群光",
    "2388.TW": "威盛",
    "2393.TW": "億光",
    "2399.TW": "映泰",
    "2404.TW": "漢唐",
    "3037.TW": "欣興",
    "3533.TW": "嘉澤",
    "6770.TW": "力積電",
    "8299.TW": "群聯",
    "2474.TW": "可成",
    "3481.TW": "群創",
    "2347.TW": "聯強",
    "2325.TW": "矽品",
    "2323.TW": "中環",
    "2344.TW": "華邦電",
    "2361.TW": "力晶科技",
    "2369.TW": "菱光",
    "2374.TW": "佳能",
    "2383.TW": "台光電",
    "2406.TW": "國碁",
    "2409.TW": "友達",
    "2417.TW": "圓剛",
    "2451.TW": "創見",
    "2455.TW": "全新",
    "2458.TW": "義隆電",
    "2462.TW": "良得",
    "2467.TW": "志超",
    "2468.TW": "凌陽",
    "2484.TW": "希華",
    "2492.TW": "貝特電",
    "2498.TW": "宏達電",
    "3023.TW": "信邦",
}

# The 7 largest US AI/tech stocks + TSM — always shown first in US results.
BIG7_TSM: List[str] = ["NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "TSM"]
BIG7_TSM_SET: set = set(BIG7_TSM)

US_NAMES: Dict[str, str] = {
    "AAPL": "Apple Inc.",
    "MSFT": "Microsoft Corp.",
    "GOOGL": "Alphabet Inc.",
    "AMZN": "Amazon.com Inc.",
    "META": "Meta Platforms",
    "NVDA": "NVIDIA Corp.",
    "TSLA": "Tesla Inc.",
    "TSM": "Taiwan Semiconductor",
    "JPM": "JPMorgan Chase",
    "V": "Visa Inc.",
    "UNH": "UnitedHealth Group",
    "XOM": "ExxonMobil Corp.",
    "JNJ": "Johnson & Johnson",
    "WMT": "Walmart Inc.",
    "MA": "Mastercard Inc.",
    "PG": "Procter & Gamble",
    "HD": "Home Depot",
    "CVX": "Chevron Corp.",
    "MRK": "Merck & Co.",
    "ABBV": "AbbVie Inc.",
    "LLY": "Eli Lilly & Co.",
    "AVGO": "Broadcom Inc.",
    "PEP": "PepsiCo Inc.",
    "KO": "Coca-Cola Co.",
    "COST": "Costco Wholesale",
    "TMO": "Thermo Fisher Scientific",
    "ACN": "Accenture plc",
    "MCD": "McDonald's Corp.",
    "BAC": "Bank of America",
    "CSCO": "Cisco Systems",
    "DHR": "Danaher Corp.",
    "ABT": "Abbott Laboratories",
    "NKE": "Nike Inc.",
    "ADBE": "Adobe Inc.",
    "CRM": "Salesforce Inc.",
    "TXN": "Texas Instruments",
    "WFC": "Wells Fargo & Co.",
    "LIN": "Linde plc",
    "PM": "Philip Morris Intl",
    "NEE": "NextEra Energy",
    "RTX": "RTX Corp.",
    "ORCL": "Oracle Corp.",
    "QCOM": "Qualcomm Inc.",
    "BMY": "Bristol-Myers Squibb",
    "LOW": "Lowe's Companies",
    "AMGN": "Amgen Inc.",
    "HON": "Honeywell Intl",
    "UPS": "United Parcel Service",
    "IBM": "IBM Corp.",
    "MS": "Morgan Stanley",
    "GS": "Goldman Sachs",
    "CAT": "Caterpillar Inc.",
    "INTU": "Intuit Inc.",
    "SPGI": "S&P Global Inc.",
    "ELV": "Elevance Health",
    "ISRG": "Intuitive Surgical",
    "SYK": "Stryker Corp.",
    "GE": "GE Aerospace",
    "MDT": "Medtronic plc",
    "ADI": "Analog Devices",
    "PLD": "Prologis Inc.",
    "AMAT": "Applied Materials",
    "BKNG": "Booking Holdings",
    "MU": "Micron Technology",
    "BX": "Blackstone Inc.",
    "C": "Citigroup Inc.",
    "AXP": "American Express",
    "SBUX": "Starbucks Corp.",
    "GILD": "Gilead Sciences",
    "MMM": "3M Company",
    "DE": "Deere & Company",
    "LRCX": "Lam Research",
    "ZTS": "Zoetis Inc.",
    "MDLZ": "Mondelez Intl",
    "CL": "Colgate-Palmolive",
    "SO": "Southern Company",
    "DUK": "Duke Energy",
    "BDX": "Becton Dickinson",
    "TGT": "Target Corp.",
    "REGN": "Regeneron Pharma",
    "EOG": "EOG Resources",
    "EQIX": "Equinix Inc.",
    "ITW": "Illinois Tool Works",
    "PH": "Parker-Hannifin",
    "EMR": "Emerson Electric",
    "EW": "Edwards Lifesciences",
    "KLAC": "KLA Corp.",
    "HCA": "HCA Healthcare",
    "AON": "Aon plc",
    "NSC": "Norfolk Southern",
    "FIS": "Fidelity Natl Info",
    "MCO": "Moody's Corp.",
    "ICE": "Intercontinental Exch.",
    "CME": "CME Group",
    "MSCI": "MSCI Inc.",
    "FDX": "FedEx Corp.",
    "ECL": "Ecolab Inc.",
    "GD": "General Dynamics",
    "ETN": "Eaton Corp.",
    "ROP": "Roper Technologies",
    "CTAS": "Cintas Corp.",
    "APD": "Air Products",
    "SHW": "Sherwin-Williams",
    "F": "Ford Motor",
    "GM": "General Motors",
    "INTC": "Intel Corp.",
    "AMD": "Advanced Micro Devices",
    "MRVL": "Marvell Technology",
}


def get_stock_name(symbol: str, market: str) -> str:
    """
    Return the display name for a stock symbol.
    Priority: static lookup dict → yfinance shortName → symbol fallback.
    Static dict covers all watchlist stocks; yfinance is only called for unknown symbols.
    """
    if market == "TW":
        if symbol in TW_NAMES:
            return TW_NAMES[symbol]
    else:
        if symbol in US_NAMES:
            return US_NAMES[symbol]

    try:
        import yfinance as yf
        info = yf.Ticker(symbol).fast_info
        name = getattr(info, "display_name", None) or getattr(info, "shortName", None)
        if name:
            return name
        full_info = yf.Ticker(symbol).info
        name = full_info.get("shortName") or full_info.get("longName")
        if name:
            return name
    except Exception:
        pass

    return symbol.replace(".TW", "") if market == "TW" else symbol


# ── Ranker ────────────────────────────────────────────────────────────────────

class StockRanker:

    def __init__(self):
        self.fetcher = StockDataFetcher()
        self.calc = MACalculator()
        self.classifier = PhaseClassifier()
        self.scorer = PhaseScorer()

    def analyse_symbol(self, symbol: str, market: str) -> Optional[Dict[str, Any]]:
        """
        Run the full ST125 pipeline for one symbol.
        Returns a dict of signal fields or None on failure.
        """
        try:
            daily_df = self.fetcher.fetch_daily_ohlcv(symbol)
            if daily_df is None or len(daily_df) < 30:
                return None

            daily_df = self.calc.calculate_daily_mas(daily_df)

            weekly_raw = self.fetcher.fetch_weekly_ohlcv(symbol)
            if weekly_raw is None or len(weekly_raw) < 52:
                return None

            weekly_df = self.calc.calculate_weekly_mas(weekly_raw)
            latest_weekly = self.calc.get_latest_weekly_row(weekly_df)
            if latest_weekly is None:
                return None

            latest_daily = daily_df.dropna(subset=["Close"]).iloc[-1]

            phase_label, crossover_event, explanation = self.classifier.classify(weekly_df)

            vol_amount_100m = float(latest_daily.get("volume_amount", 0) or 0) / 1e8

            result = {
                "symbol": symbol,
                "market": market,
                "signal_date": date.today(),
                "stock_name": get_stock_name(symbol, market),
                "close_price": float(latest_daily["Close"]),
                "volume": float(latest_daily["Volume"]),
                "volume_amount_100m": vol_amount_100m,
                "w2": _safe_float(latest_weekly, "W2"),
                "w10": _safe_float(latest_weekly, "W10"),
                "w26": _safe_float(latest_weekly, "W26"),
                "w52": _safe_float(latest_weekly, "W52"),
                "d2": _safe_float(latest_daily, "D2"),
                "d10": _safe_float(latest_daily, "D10"),
                "d50": _safe_float(latest_daily, "D50"),
                "d132": _safe_float(latest_daily, "D132"),
                "d260": _safe_float(latest_daily, "D260"),
                "slope_w2": _safe_float(latest_weekly, "slope_w2"),
                "slope_w10": _safe_float(latest_weekly, "slope_w10"),
                "slope_w26": _safe_float(latest_weekly, "slope_w26"),
                "slope_w52": _safe_float(latest_weekly, "slope_w52"),
                "sar_value": _safe_float(latest_weekly, "sar_value"),
                "sar_signal": str(latest_weekly.get("sar_signal", "unknown") or "unknown"),
                "phase_label": phase_label,
                "crossover_event": crossover_event,
                "explanation": explanation,
                "phase_score": 0.0,
                "eps": None,
            }

            # Fetch EPS (trailing 12 months) from yfinance fundamentals
            try:
                import yfinance as yf
                info = yf.Ticker(symbol).info
                eps_val = info.get("trailingEps") or info.get("epsTrailingTwelveMonths")
                result["eps"] = float(eps_val) if eps_val is not None else None
            except Exception:
                result["eps"] = None

            return result
        except Exception as e:
            logger.error(f"Analysis failed for {symbol}: {e}")
            return None

    def rank_market(
        self, market: str, top_n: int = 10, max_symbols: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Run analysis for all watchlist symbols in a market and return ranked results.

        TW: top N by phase_score.
        US: Big 7 + TSM pinned first (regardless of phase), then top N from the rest.

        Parameters
        ----------
        market      : "TW" or "US"
        top_n       : number of top results from the non-pinned pool (US: pinned 8 + top_n)
        max_symbols : cap on watchlist size (for speed)
        """
        if market == "TW":
            watchlist = self.fetcher.get_tw_watchlist(top_n=max_symbols)
        else:
            # Ensure all Big 7 + TSM are in the watchlist
            base = self.fetcher.get_us_watchlist(top_n=max_symbols)
            extras = [s for s in BIG7_TSM if s not in base]
            watchlist = extras + base

        logger.info(f"Analysing {len(watchlist)} {market} symbols …")

        results: List[Dict[str, Any]] = []
        for sym in watchlist:
            signal = self.analyse_symbol(sym, market)
            if signal:
                results.append(signal)

        if not results:
            logger.warning(f"No results for market {market}")
            return []

        amounts = [r["volume_amount_100m"] for r in results if r["volume_amount_100m"]]
        p90 = float(np.percentile(amounts, 90)) if amounts else 1.0

        for r in results:
            r["phase_score"] = PhaseScorer.calculate(
                phase_label=r["phase_label"],
                slope_w10=r.get("slope_w10"),
                volume_amount_100m=r.get("volume_amount_100m"),
                volume_universe_p90=p90,
            )
            r["score"] = r["phase_score"]

        if market == "TW":
            results.sort(key=lambda x: x["phase_score"], reverse=True)
            return results[:top_n]

        # US: pinned Big 7 + TSM first (fixed order), then top_n from the rest
        results_map: Dict[str, Dict[str, Any]] = {r["symbol"]: r for r in results}

        pinned = [results_map[sym] for sym in BIG7_TSM if sym in results_map]

        rest = sorted(
            [r for sym, r in results_map.items() if sym not in BIG7_TSM_SET],
            key=lambda x: x["phase_score"],
            reverse=True,
        )[:top_n]

        return pinned + rest


def _safe_float(row, key: str) -> Optional[float]:
    try:
        v = row[key] if hasattr(row, "__getitem__") else getattr(row, key, None)
        if v is None or (isinstance(v, float) and np.isnan(v)):
            return None
        return float(v)
    except Exception:
        return None
