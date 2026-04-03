"""
J6.1 – TW/US Market Data Fetcher
ST125 theory: fetch 2 years of daily OHLCV for watchlist stocks.
TW watchlist: top 100 by daily volume × avg(OHLC) in NT$ 100M.
US watchlist: S&P 500 top 100 dollar-volume + Big 7 + TSM forced-include.
"""

import os
import time
import logging
from typing import List, Optional
from datetime import datetime, timedelta

import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

BIG7_US = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA"]
FORCED_US = BIG7_US + ["TSM"]

TW_MAJOR = [
    "2330.TW", "2317.TW", "2454.TW", "2382.TW", "2308.TW", "3711.TW",
    "2881.TW", "2882.TW", "2886.TW", "2891.TW", "2884.TW", "2885.TW",
    "2892.TW", "5880.TW", "2603.TW", "2615.TW", "2609.TW", "2610.TW",
    "2618.TW", "2301.TW", "2303.TW", "2357.TW", "3034.TW", "6505.TW",
    "1301.TW", "1303.TW", "1326.TW", "2002.TW", "1101.TW", "1216.TW",
    "2912.TW", "2207.TW", "2395.TW", "3008.TW", "2379.TW", "3231.TW",
    "2327.TW", "2353.TW", "2408.TW", "2345.TW", "2337.TW", "2376.TW",
    "6669.TW", "2356.TW", "4938.TW", "2360.TW", "2201.TW", "2105.TW",
    "1402.TW", "1504.TW", "2834.TW", "5871.TW", "2823.TW", "2880.TW",
    "2887.TW", "2888.TW", "2889.TW", "2890.TW", "5876.TW", "2801.TW",
    "2371.TW", "2377.TW", "3045.TW", "4904.TW", "2412.TW", "3324.TW",
    "6415.TW", "3017.TW", "2385.TW", "2388.TW", "2393.TW", "2399.TW",
    "2404.TW", "3037.TW", "3533.TW", "6770.TW", "8299.TW", "2474.TW",
    "3481.TW", "2347.TW", "2325.TW", "2323.TW", "2344.TW", "2361.TW",
    "2369.TW", "2374.TW", "2383.TW", "2406.TW", "2409.TW", "2417.TW",
    "2451.TW", "2455.TW", "2458.TW", "2462.TW", "2467.TW", "2468.TW",
    "2484.TW", "2492.TW", "2498.TW", "3023.TW",
]

SP500_SAMPLE = [
    "AMZN", "AAPL", "MSFT", "GOOGL", "META", "NVDA", "TSLA", "TSM",
    "JPM", "V", "UNH", "XOM", "JNJ", "WMT", "MA", "PG", "HD", "CVX",
    "MRK", "ABBV", "LLY", "AVGO", "PEP", "KO", "COST", "TMO", "ACN",
    "MCD", "BAC", "CSCO", "DHR", "ABT", "NKE", "ADBE", "CRM", "TXN",
    "WFC", "LIN", "PM", "NEE", "RTX", "ORCL", "QCOM", "BMY", "LOW",
    "AMGN", "HON", "UPS", "IBM", "MS", "GS", "CAT", "INTU", "SPGI",
    "ELV", "ISRG", "SYK", "GE", "MDT", "ADI", "PLD", "AMAT", "BKNG",
    "MU", "BX", "C", "AXP", "SBUX", "GILD", "MMM", "DE", "LRCX",
    "ZTS", "MDLZ", "CL", "SO", "DUK", "BDX", "TGT", "REGN", "EOG",
    "EQIX", "ITW", "PH", "EMR", "EW", "KLAC", "HCA", "AON", "NSC",
    "FIS", "MCO", "ICE", "CME", "MSCI", "FDX", "ECL", "GD", "ETN",
    "ROP", "CTAS", "APD", "SHW", "F", "GM", "INTC", "AMD", "MRVL",
]


class StockDataFetcher:

    HISTORY_YEARS = 2

    def get_tw_watchlist(self, top_n: int = 100) -> List[str]:
        """Return top N TW stocks by dollar volume + major caps."""
        scored: List[tuple] = []
        batch_size = 20

        for i in range(0, len(TW_MAJOR), batch_size):
            batch = TW_MAJOR[i : i + batch_size]
            try:
                data = yf.download(
                    batch,
                    period="5d",
                    interval="1d",
                    progress=False,
                    threads=True,
                    auto_adjust=True,
                )
                for sym in batch:
                    try:
                        if isinstance(data.columns, pd.MultiIndex):
                            close = data["Close"][sym].dropna()
                            vol = data["Volume"][sym].dropna()
                        else:
                            close = data["Close"].dropna()
                            vol = data["Volume"].dropna()
                        if close.empty or vol.empty:
                            scored.append((sym, 0.0))
                            continue
                        avg_amount = (close * vol).mean() / 1e8
                        scored.append((sym, float(avg_amount)))
                    except Exception:
                        scored.append((sym, 0.0))
            except Exception as e:
                logger.warning(f"TW batch fetch failed: {e}")
                for sym in batch:
                    scored.append((sym, 0.0))
            time.sleep(0.5)

        scored.sort(key=lambda x: x[1], reverse=True)
        top_syms = [s for s, _ in scored[:top_n]]
        for sym in TW_MAJOR[:10]:
            if sym not in top_syms:
                top_syms.append(sym)
        return top_syms

    def get_us_watchlist(self, top_n: int = 100) -> List[str]:
        """Return top N US stocks by dollar volume + forced Big7 + TSM."""
        universe = list(dict.fromkeys(FORCED_US + SP500_SAMPLE))
        scored: List[tuple] = []
        batch_size = 20

        for i in range(0, len(universe), batch_size):
            batch = universe[i : i + batch_size]
            try:
                data = yf.download(
                    batch,
                    period="5d",
                    interval="1d",
                    progress=False,
                    threads=True,
                    auto_adjust=True,
                )
                for sym in batch:
                    try:
                        if isinstance(data.columns, pd.MultiIndex):
                            close = data["Close"][sym].dropna()
                            vol = data["Volume"][sym].dropna()
                        else:
                            close = data["Close"].dropna()
                            vol = data["Volume"].dropna()
                        if close.empty or vol.empty:
                            scored.append((sym, 0.0))
                            continue
                        avg_amount = (close * vol).mean()
                        scored.append((sym, float(avg_amount)))
                    except Exception:
                        scored.append((sym, 0.0))
            except Exception as e:
                logger.warning(f"US batch fetch failed: {e}")
                for sym in batch:
                    scored.append((sym, 0.0))
            time.sleep(0.5)

        scored.sort(key=lambda x: x[1], reverse=True)
        top_syms = [s for s, _ in scored[:top_n]]
        for sym in FORCED_US:
            if sym not in top_syms:
                top_syms.append(sym)
        return top_syms

    def fetch_daily_ohlcv(
        self, symbol: str, years: int = None
    ) -> Optional[pd.DataFrame]:
        """Fetch daily OHLCV for a symbol. Returns None on failure."""
        years = years or self.HISTORY_YEARS
        period = f"{years}y"
        try:
            ticker = yf.Ticker(symbol)
            df = ticker.history(period=period, interval="1d", auto_adjust=True)
            if df.empty or len(df) < 30:
                logger.warning(f"Insufficient daily data for {symbol}")
                return None
            df.index = pd.to_datetime(df.index)
            df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
            df.dropna(subset=["Close"], inplace=True)
            df["volume_amount"] = df["Close"] * df["Volume"]
            return df
        except Exception as e:
            logger.error(f"Failed to fetch {symbol}: {e}")
            return None

    def fetch_weekly_ohlcv(
        self, symbol: str, years: int = None
    ) -> Optional[pd.DataFrame]:
        """
        Resample daily data to weekly OHLCV.
        Weekly candle: Monday open, Friday close, sum volume.
        """
        daily = self.fetch_daily_ohlcv(symbol, years)
        if daily is None:
            return None
        try:
            weekly = daily.resample("W").agg(
                {
                    "Open": "first",
                    "High": "max",
                    "Low": "min",
                    "Close": "last",
                    "Volume": "sum",
                    "volume_amount": "sum",
                }
            ).dropna(subset=["Close"])
            if len(weekly) < 52:
                logger.warning(f"Insufficient weekly data for {symbol}")
                return None
            return weekly
        except Exception as e:
            logger.error(f"Weekly resample failed for {symbol}: {e}")
            return None
