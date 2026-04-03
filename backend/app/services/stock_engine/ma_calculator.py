"""
J6.2 – Moving Average Calculator + Slope + SAR
ST125 equivalences:
  Weekly: W2, W10, W26, W52  (SMA on weekly bars)
  Daily:  D2, D10, D50, D132, D260
  Slope:  (MA_today - MA_yesterday) / MA_yesterday * 100 (pct change)
  SAR:    Parabolic SAR — "low" when SAR < close (support), "high" when SAR > close (pressure)
"""

import logging
from typing import Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

try:
    from ta.trend import PSARIndicator as _PSARIndicator
    _HAS_TA = True
except ImportError:
    _HAS_TA = False
    logger.warning("ta library not available; using manual SAR fallback")


class MACalculator:

    @staticmethod
    def sma(series: pd.Series, window: int) -> pd.Series:
        return series.rolling(window=window, min_periods=window).mean()

    @staticmethod
    def slope_pct(series: pd.Series) -> pd.Series:
        """Percentage slope: (today - yesterday) / yesterday * 100."""
        return series.pct_change() * 100

    @staticmethod
    def _manual_sar(
        high: pd.Series, low: pd.Series, close: pd.Series,
        af_step: float = 0.02, af_max: float = 0.2
    ) -> pd.Series:
        """Manual Parabolic SAR implementation as fallback."""
        sar = pd.Series(index=close.index, dtype=float)
        if len(close) < 2:
            return sar
        bull = True
        ep = low.iloc[0]
        af = af_step
        sar.iloc[0] = high.iloc[0]

        for i in range(1, len(close)):
            prev_sar = sar.iloc[i - 1]
            if bull:
                new_sar = prev_sar + af * (ep - prev_sar)
                new_sar = min(new_sar, low.iloc[i - 1],
                              low.iloc[max(0, i - 2)])
                if low.iloc[i] < new_sar:
                    bull = False
                    new_sar = ep
                    ep = low.iloc[i]
                    af = af_step
                else:
                    if high.iloc[i] > ep:
                        ep = high.iloc[i]
                        af = min(af + af_step, af_max)
            else:
                new_sar = prev_sar + af * (ep - prev_sar)
                new_sar = max(new_sar, high.iloc[i - 1],
                              high.iloc[max(0, i - 2)])
                if high.iloc[i] > new_sar:
                    bull = True
                    new_sar = ep
                    ep = high.iloc[i]
                    af = af_step
                else:
                    if low.iloc[i] < ep:
                        ep = low.iloc[i]
                        af = min(af + af_step, af_max)
            sar.iloc[i] = new_sar
        return sar

    @classmethod
    def calculate_weekly_mas(cls, weekly_df: pd.DataFrame) -> pd.DataFrame:
        """
        Add W2/W10/W26/W52 SMAs and their slopes to a weekly OHLCV DataFrame.
        Also adds SAR signal for the weekly timeframe.
        """
        df = weekly_df.copy()
        close = df["Close"]
        high = df["High"]
        low = df["Low"]

        for period, col in [(2, "W2"), (10, "W10"), (26, "W26"), (52, "W52")]:
            df[col] = cls.sma(close, period)
            slope_col = f"slope_{col.lower()}"
            df[slope_col] = cls.slope_pct(df[col])

        df["slope_w10_prev"] = df["slope_w10"].shift(1)

        df["sar_value"], df["sar_signal"] = cls._compute_sar(high, low, close)

        return df

    @classmethod
    def calculate_daily_mas(cls, daily_df: pd.DataFrame) -> pd.DataFrame:
        """
        Add D2/D10/D50/D132/D260 SMAs and their slopes to a daily OHLCV DataFrame.
        """
        df = daily_df.copy()
        close = df["Close"]

        for period, col in [
            (2, "D2"), (10, "D10"), (50, "D50"), (132, "D132"), (260, "D260")
        ]:
            df[col] = cls.sma(close, period)
            df[f"slope_{col.lower()}"] = cls.slope_pct(df[col])

        return df

    @classmethod
    def _compute_sar(
        cls, high: pd.Series, low: pd.Series, close: pd.Series
    ) -> tuple:
        """
        Compute Parabolic SAR and classify each bar as 'low' / 'high' / 'unknown'.
        low  = SAR below close → bullish support dots
        high = SAR above close → bearish pressure dots
        """
        sar_values = pd.Series(index=close.index, dtype=float)
        sar_signals = pd.Series(index=close.index, dtype=object)
        sar_signals[:] = "unknown"

        if _HAS_TA:
            try:
                psar_ind = _PSARIndicator(
                    high=high, low=low, close=close,
                    step=0.02, max_step=0.2, fillna=False
                )
                psar_up = psar_ind.psar_up()
                psar_down = psar_ind.psar_down()
                for idx in close.index:
                    lv = psar_up.get(idx) if psar_up is not None else None
                    sv = psar_down.get(idx) if psar_down is not None else None
                    if pd.notna(lv):
                        sar_values[idx] = float(lv)
                        sar_signals[idx] = "low" if float(lv) < float(close[idx]) else "unknown"
                    elif pd.notna(sv):
                        sar_values[idx] = float(sv)
                        sar_signals[idx] = "high" if float(sv) > float(close[idx]) else "unknown"
                return sar_values, sar_signals
            except Exception as e:
                logger.warning(f"ta SAR failed, using fallback: {e}")

        sar_raw = cls._manual_sar(high, low, close)
        for idx in close.index:
            sv = sar_raw.get(idx)
            if pd.isna(sv):
                continue
            sar_values[idx] = sv
            if sv < close[idx]:
                sar_signals[idx] = "low"
            elif sv > close[idx]:
                sar_signals[idx] = "high"

        return sar_values, sar_signals

    @classmethod
    def get_latest_weekly_row(cls, weekly_df: pd.DataFrame) -> Optional[pd.Series]:
        """Return the latest complete weekly bar with all MAs computed."""
        required = ["W2", "W10", "W26", "W52"]
        valid = weekly_df.dropna(subset=required)
        if valid.empty:
            return None
        return valid.iloc[-1]
