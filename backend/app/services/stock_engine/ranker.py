"""
J6.4 – Stock Ranker
Runs the full analysis pipeline for a watchlist and returns ranked results.
Top 10 TW + Top 10 US ranked by phase_score descending.
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
            }
            return result
        except Exception as e:
            logger.error(f"Analysis failed for {symbol}: {e}")
            return None

    def rank_market(
        self, market: str, top_n: int = 10, max_symbols: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Run analysis for all watchlist symbols in a market and return top N by score.

        Parameters
        ----------
        market      : "TW" or "US"
        top_n       : number of top results to return
        max_symbols : cap on watchlist size (for speed)
        """
        if market == "TW":
            watchlist = self.fetcher.get_tw_watchlist(top_n=max_symbols)
        else:
            watchlist = self.fetcher.get_us_watchlist(top_n=max_symbols)

        logger.info(f"Analysing {len(watchlist)} {market} symbols …")

        results = []
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

        results.sort(key=lambda x: x["phase_score"], reverse=True)
        return results[:top_n]


def _safe_float(row, key: str) -> Optional[float]:
    try:
        v = row[key] if hasattr(row, "__getitem__") else getattr(row, key, None)
        if v is None or (isinstance(v, float) and np.isnan(v)):
            return None
        return float(v)
    except Exception:
        return None
