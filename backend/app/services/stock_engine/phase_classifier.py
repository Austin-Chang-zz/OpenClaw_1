"""
J6.3 – ST125 Phase Classifier
Rules sourced verbatim from ST125_2.pdf "Permutations & Combinations (Weekly)".

14 sub-phases:
  X1, X2          — Pre-Bullish (Correction Bottom)
  A1, A2, A3, A4, A5 — Bullish Transition / Rising
  B1, B2          — Bull Peak / Overheating
  Y1, Y2          — Pre-Bearish (Correction Top)
  C1, C2, C3, C4, C5 — Bearish Transition / Falling
  D1, D2          — Bear Bottom

Inputs required (weekly bar):
  W2, W10, W26, W52       — MA values
  slope_w2/w10/w26/w52    — % slope per period
  slope_w10_prev          — prior period W10 slope (for B2/D2 acceleration)
  sar_signal              — 'low' / 'high' / 'unknown'
  (plus prior bar for crossover detection)
"""

import logging
from typing import Optional, Tuple

import pandas as pd

logger = logging.getLogger(__name__)

CROSSOVER_LOOKBACK = 3


class PhaseClassifier:

    @staticmethod
    def _positive(slope: float) -> bool:
        return slope > 0

    @staticmethod
    def _negative(slope: float) -> bool:
        return slope < 0

    @staticmethod
    def _crossed_above(
        series_fast: pd.Series, series_slow: pd.Series, lookback: int = CROSSOVER_LOOKBACK
    ) -> bool:
        """True if fast crossed above slow within the last `lookback` weekly bars."""
        if len(series_fast) < 2 or len(series_slow) < 2:
            return False
        for i in range(1, min(lookback + 1, len(series_fast))):
            if (
                series_fast.iloc[-i - 1] < series_slow.iloc[-i - 1]
                and series_fast.iloc[-i] >= series_slow.iloc[-i]
            ):
                return True
        return False

    @staticmethod
    def _crossed_below(
        series_fast: pd.Series, series_slow: pd.Series, lookback: int = CROSSOVER_LOOKBACK
    ) -> bool:
        """True if fast crossed below slow within the last `lookback` weekly bars."""
        if len(series_fast) < 2 or len(series_slow) < 2:
            return False
        for i in range(1, min(lookback + 1, len(series_fast))):
            if (
                series_fast.iloc[-i - 1] > series_slow.iloc[-i - 1]
                and series_fast.iloc[-i] <= series_slow.iloc[-i]
            ):
                return True
        return False

    @classmethod
    def classify(cls, weekly_df: pd.DataFrame) -> Tuple[str, str, str]:
        """
        Classify the latest weekly bar into an ST125 sub-phase.

        Returns
        -------
        phase_label    : str  e.g. "A2"
        crossover_event: str  e.g. "W2_XO_W10" or ""
        explanation    : str  human-readable description
        """
        required = ["W2", "W10", "W26", "W52",
                    "slope_w2", "slope_w10", "slope_w26", "slope_w52",
                    "slope_w10_prev", "sar_signal"]
        valid = weekly_df.dropna(subset=["W2", "W10", "W26", "W52"])
        if len(valid) < 2:
            return "UNKNOWN", "", "Insufficient weekly data for classification"

        row = valid.iloc[-1]
        w2 = float(row["W2"])
        w10 = float(row["W10"])
        w26 = float(row["W26"])
        w52 = float(row["W52"])

        sl_w2 = float(row.get("slope_w2", 0) or 0)
        sl_w10 = float(row.get("slope_w10", 0) or 0)
        sl_w26 = float(row.get("slope_w26", 0) or 0)
        sl_w52 = float(row.get("slope_w52", 0) or 0)
        sl_w10_prev = float(row.get("slope_w10_prev", sl_w10) or sl_w10)
        sar = str(row.get("sar_signal", "unknown") or "unknown")

        ma2_s = valid["W2"]
        ma10_s = valid["W10"]
        ma26_s = valid["W26"]

        co_w2_xo_w10 = cls._crossed_above(ma2_s, ma10_s)
        co_w2_un_w10 = cls._crossed_below(ma2_s, ma10_s)
        co_w10_xo_w26 = cls._crossed_above(ma10_s, ma26_s)
        co_w10_un_w26 = cls._crossed_below(ma10_s, ma26_s)

        crossover_event = ""
        if co_w2_xo_w10:
            crossover_event = "W2_XO_W10"
        elif co_w10_xo_w26:
            crossover_event = "W10_XO_W26"
        elif co_w2_un_w10:
            crossover_event = "W2_UN_W10"
        elif co_w10_un_w26:
            crossover_event = "W10_UN_W26"

        phase, explanation = cls._apply_rules(
            w2, w10, w26, w52,
            sl_w2, sl_w10, sl_w26, sl_w52, sl_w10_prev,
            sar,
            co_w2_xo_w10, co_w2_un_w10, co_w10_xo_w26, co_w10_un_w26,
        )
        return phase, crossover_event, explanation

    @classmethod
    def _apply_rules(
        cls,
        w2, w10, w26, w52,
        sl_w2, sl_w10, sl_w26, sl_w52, sl_w10_prev,
        sar,
        co_w2_xo_w10, co_w2_un_w10, co_w10_xo_w26, co_w10_un_w26,
    ) -> Tuple[str, str]:
        """
        Apply ST125 phase rules in order of specificity.
        More specific / crossover-based rules are checked first.
        """
        pos = cls._positive
        neg = cls._negative

        # ── Phase X: Pre-Bullish (Correction Bottom) ────────────────────────
        # X1: 52>26>10, all slopes 52/26/10 negative, W2 crosses above W10
        if (w52 > w26 > w10
                and neg(sl_w52) and neg(sl_w26) and neg(sl_w10)
                and co_w2_xo_w10):
            return "X1", (
                "Bear bottom forming: W52>W26>W10 all slopes negative, "
                "W2 just crossed above W10 — smart money entry zone"
            )

        # X2: 52>26>10, slopes 52/26 negative, W2 crosses above W10, SAR low dots
        if (w52 > w26 > w10
                and neg(sl_w52) and neg(sl_w26)
                and co_w2_xo_w10
                and sar == "low"):
            return "X2", (
                "Strong bottom entry: W52>W26>W10, W2 crossed above W10, "
                "SAR support dots confirmed — high-conviction accumulation zone"
            )

        # ── Phase Y: Pre-Bearish (Correction Top) ───────────────────────────
        # Y1: 52<26<10, all slopes 52/26/10 positive, W2 crosses under W10
        if (w52 < w26 < w10
                and pos(sl_w52) and pos(sl_w26) and pos(sl_w10)
                and co_w2_un_w10):
            return "Y1", (
                "Bull top forming: W10>W26>W52 all slopes positive, "
                "W2 just crossed below W10 — distribution zone, prepare to exit"
            )

        # Y2: 52<26<10, slopes 52/26 positive, W2 crosses under W10, SAR high dots
        if (w52 < w26 < w10
                and pos(sl_w52) and pos(sl_w26)
                and co_w2_un_w10
                and sar == "high"):
            return "Y2", (
                "Confirmed top: W10>W26>W52, W2 crossed below W10, "
                "SAR pressure dots — exit long positions now"
            )

        # ── Phase A: Bullish Transition / Rising ────────────────────────────
        # A1: 52>26, all slopes 52/26 negative, W10 crosses above W26, SAR low dots
        if (w52 > w26
                and neg(sl_w52) and neg(sl_w26)
                and co_w10_xo_w26
                and sar == "low"):
            return "A1", (
                "Early bull entry: W52>W26, W10 just crossed above W26, "
                "SAR support dots — trend reversal confirmed, strong entry"
            )

        # A2: 52>10>26, slope 52 negative, SAR low dots
        if (w52 > w10 > w26
                and neg(sl_w52)
                and sar == "low"):
            return "A2", (
                "Bull progressing: W52>W10>W26, yearly line still declining "
                "but trend line above half-year — good entry with SAR support"
            )

        # A3: 10>52>26, slope 52 negative
        if w10 > w52 > w26 and neg(sl_w52):
            return "A3", (
                "Mid-bull: W10>W52>W26, trend line above yearly but yearly "
                "still declining — solid uptrend, momentum building"
            )

        # ── Phase B: Bull Peak / Overheating ────────────────────────────────
        # Checked BEFORE A4/A5 because B1/B2 require same ordering (W10>W26>W52)
        # but add the stricter all-slopes-positive requirement.

        # B2: 10>26>52, all slopes positive, W10 slope accelerating
        if (w10 > w26 > w52
                and pos(sl_w52) and pos(sl_w26) and pos(sl_w10)
                and sl_w10 > sl_w10_prev):
            return "B2", (
                "Peak bull (accelerating): W10>W26>W52 all positive, "
                "W10 slope still increasing — euphoria stage, high reversal risk"
            )

        # B1: 10>26>52, all slopes positive
        if (w10 > w26 > w52
                and pos(sl_w52) and pos(sl_w26) and pos(sl_w10)):
            return "B1", (
                "Full bull market: W10>W26>W52 all slopes positive — "
                "trend intact but elevated, lower priority for new entries"
            )

        # A4: 10>26>52, slope 52 positive (but not all slopes positive → not B1/B2)
        if w10 > w26 > w52 and pos(sl_w52):
            return "A4", (
                "Maturing bull: W10>W26>W52, yearly line turning positive "
                "— strong uptrend developing, watch for B1 transition"
            )

        # A5: 26>10>52, slope 52 positive
        if w26 > w10 > w52 and pos(sl_w52):
            return "A5", (
                "Late-bull: W26>W10>W52, yearly line positive but trend "
                "line below half-year — bull maturing, watch for B phase"
            )

        # ── Phase C: Bearish Transition / Falling ───────────────────────────
        # C1: 52<26, all slopes 52/26 positive, W10 crosses under W26, SAR high dots
        if (w52 < w26
                and pos(sl_w52) and pos(sl_w26)
                and co_w10_un_w26
                and sar == "high"):
            return "C1", (
                "Early bear entry: W10 just crossed below W26, SAR pressure "
                "dots — trend reversal confirmed, exit longs / watch for shorts"
            )

        # C2: 52<10<26, slope 52 positive, SAR high dots
        if (w52 < w10 < w26
                and pos(sl_w52)
                and sar == "high"):
            return "C2", (
                "Bear progressing: W26>W10>W52, yearly line still rising "
                "but trend line below half-year — SAR pressure confirms weakness"
            )

        # C3: 10<52<26, slope 52 positive
        if w10 < w52 < w26 and pos(sl_w52):
            return "C3", (
                "Mid-bear: W26>W52>W10, trend line below yearly — "
                "downtrend broadening, yearly line still positive"
            )

        # ── Phase D: Bear Bottom ────────────────────────────────────────────
        # Checked BEFORE C4 because D1/D2 have same ordering as C4 (W10<W26<W52)
        # but add the stricter all-slopes-negative requirement.

        # D2: 10<26<52, all slopes negative, W10 slope accelerating downward
        if (w10 < w26 < w52
                and neg(sl_w52) and neg(sl_w26) and neg(sl_w10)
                and sl_w10 < sl_w10_prev):
            return "D2", (
                "Bear bottom (accelerating): W52>W26>W10 all negative, "
                "W10 slope worsening — panic selling, watch for exhaustion reversal"
            )

        # D1: 10<26<52, all slopes negative
        if (w10 < w26 < w52
                and neg(sl_w52) and neg(sl_w26) and neg(sl_w10)):
            return "D1", (
                "Full bear market: W52>W26>W10 all slopes negative — "
                "strong downtrend, wait for W2 reversal signal"
            )

        # C4: 10<26<52, slope 52 negative (but not all slopes negative → not D1/D2)
        if w10 < w26 < w52 and neg(sl_w52):
            return "C4", (
                "Deep bear: W52>W26>W10, yearly line now negative — "
                "full bear configuration, avoid longs"
            )

        # C5: 26<10<52, slope 52 negative
        if w26 < w10 < w52 and neg(sl_w52):
            return "C5", (
                "Late bear: W52>W10>W26, yearly negative but trend line "
                "temporarily above half-year — bear bounce, not a reversal"
            )

        return "MIXED", (
            f"Mixed signals: W2={w2:.2f} W10={w10:.2f} W26={w26:.2f} W52={w52:.2f} "
            f"slopes: W10={sl_w10:.2f}% W26={sl_w26:.2f}% W52={sl_w52:.2f}% SAR={sar}"
        )
