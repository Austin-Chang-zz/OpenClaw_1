"""
J6.4 – ST125 Phase Scorer
Extended to 28 sub-phases per ST125_phase.md (2026).

Higher score = better buy/entry opportunity.
Lower score  = bearish / avoid / exit.

Scoring philosophy:
  Phase X (Correction / Bottoming):
    X2 (94), X1 (88): best bottom entries — crossover + SAR/all-neg confirmed
    X3 (79): W52>W10>W26, slopes neg, price rising — good accumulation zone
    X4 (72): W52>W10>W26, W2 slope turns positive — weak uptrend forming
    X5 (=A3): see A3

  Phase A (Adaptation / Uptrend):
    A1 (82), A2 (75): crossover-based bull starts
    A3 (67): mid-bull (= X5 conditions)
    A4 (58), A5 (50): mature/late bull

  Phase B (Overheating / Peak):
    B1 (40): full bull (all slopes positive)
    B4 (36): decelerating bull — hidden divergence, early warning
    B2 (32): accelerating bull — blow-off top risk
    B3 (27): all positive + SAR high — overextended

  Phase Y (Correction / Top):
    Y1 (15), Y2 (8): crossover-based tops → EXIT
    Y4 (13): fake breakdown — price below 26 but 52 rising
    Y3 (11): distribution — MA10 between MA52/26, price weakening
    Y5 (=C3): see C3

  Phase C (Adaptation / Downtrend):
    C1 (22), C2 (20): crossover-based bear starts
    C3 (18): mid-bear (= Y5 conditions)
    C4 (15), C5 (12): deep/late bear

  Phase D (Overheating / Bottom):
    D3 (42): SAR low appears in full bear — potential reversal
    D4 (38): slope flattening — hidden bullish divergence
    D2 (35): accelerating down — panic/exhaustion watch
    D1 (30): full bear, avoid longs

Volume bonus: up to +3 pts for high dollar-volume (top decile).
Slope bonus:  up to +2 pts for strong positive W10 slope direction.
"""

import math
from typing import Optional

PHASE_BASE_SCORES: dict[str, float] = {
    "X2": 94.0,
    "X1": 88.0,
    "X3": 79.0,
    "X4": 72.0,
    "A1": 82.0,
    "A2": 75.0,
    "A3": 67.0,
    "A4": 58.0,
    "A5": 50.0,
    "B1": 40.0,
    "B4": 36.0,
    "B2": 32.0,
    "B3": 27.0,
    "Y1": 15.0,
    "Y2": 8.0,
    "Y4": 13.0,
    "Y3": 11.0,
    "C1": 22.0,
    "C2": 20.0,
    "C3": 18.0,
    "C4": 15.0,
    "C5": 12.0,
    "D3": 42.0,
    "D4": 38.0,
    "D2": 35.0,
    "D1": 30.0,
    "MIXED": 25.0,
    "UNKNOWN": 0.0,
}

BULLISH_PHASES = {"X1", "X2", "X3", "X4", "A1", "A2", "A3", "A4", "A5"}
PEAK_PHASES = {"B1", "B2", "B3", "B4"}
TOP_PHASES = {"Y1", "Y2", "Y3", "Y4"}
BEAR_PHASES = {"C1", "C2", "C3", "C4", "C5"}
BOTTOM_PHASES = {"D1", "D2", "D3", "D4"}


class PhaseScorer:

    @staticmethod
    def calculate(
        phase_label: str,
        slope_w10: Optional[float] = None,
        volume_amount_100m: Optional[float] = None,
        volume_universe_p90: Optional[float] = None,
    ) -> float:
        """
        Compute final score 0–100.

        Parameters
        ----------
        phase_label          : ST125 sub-phase label (e.g. "A2")
        slope_w10            : W10 percentage slope (current bar)
        volume_amount_100m   : daily dollar volume in NT$/USD 100M units
        volume_universe_p90  : 90th percentile dollar volume in the watchlist
                               (used for volume bonus normalization)
        """
        base = PHASE_BASE_SCORES.get(phase_label, 0.0)

        slope_bonus = 0.0
        if slope_w10 is not None and math.isfinite(slope_w10):
            if phase_label in BULLISH_PHASES and slope_w10 > 0:
                slope_bonus = min(2.0, slope_w10 * 0.5)
            elif phase_label in (BEAR_PHASES | TOP_PHASES) and slope_w10 < 0:
                slope_bonus = min(1.0, abs(slope_w10) * 0.2)

        vol_bonus = 0.0
        if (
            volume_amount_100m is not None
            and volume_universe_p90 is not None
            and volume_universe_p90 > 0
            and math.isfinite(volume_amount_100m)
        ):
            ratio = volume_amount_100m / volume_universe_p90
            vol_bonus = min(3.0, ratio * 3.0)

        score = base + slope_bonus + vol_bonus
        return round(min(100.0, max(0.0, score)), 2)

    @staticmethod
    def phase_group(phase_label: str) -> str:
        """Return high-level phase group for display."""
        if phase_label in BULLISH_PHASES:
            return "BULLISH"
        if phase_label in PEAK_PHASES:
            return "PEAK"
        if phase_label in TOP_PHASES:
            return "TOP"
        if phase_label in BEAR_PHASES:
            return "BEARISH"
        if phase_label in BOTTOM_PHASES:
            return "BOTTOM"
        return "MIXED"

    @staticmethod
    def is_entry_signal(phase_label: str) -> bool:
        return phase_label in {"X1", "X2", "X3", "X4", "A1", "A2"}

    @staticmethod
    def is_exit_signal(phase_label: str) -> bool:
        return phase_label in {"Y1", "Y2", "Y3", "Y4", "C1", "C2"}
