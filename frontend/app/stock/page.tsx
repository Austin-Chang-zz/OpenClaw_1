"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import ThemeToggle from "../../components/ThemeToggle";

const StockChartWindow = dynamic(() => import("../../components/StockChartWindow"), { ssr: false });
const DailyChartWindow = dynamic(() => import("../../components/DailyChartWindow"), { ssr: false });
const AnalysisTableWindow = dynamic(() => import("../../components/AnalysisTableWindow"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

interface Signal {
  symbol: string;
  stock_name: string | null;
  phase_label: string;
  phase_score: number;
  close_price: number | null;
  volume_amount_100m: number | null;
  eps: number | null;
  w10: number | null;
  w26: number | null;
  w52: number | null;
  slope_w10: number | null;
  slope_w26: number | null;
  slope_w52: number | null;
  sar_signal: string | null;
  sar_count: number | null;
  crossover_event: string | null;
  explanation: string | null;
}

interface LatestReport {
  date: string | null;
  market: string;
  count: number;
  signals: Signal[];
}

interface PhaseLegendItem {
  phase: string;
  base_score: number;
  group: string;
  is_entry: boolean;
  is_exit: boolean;
}

// ── US Pinned stocks (Big 7 + TSM) ────────────────────────────────────────────

const BIG7_TSM = ["NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "TSM"] as const;
const BIG7_TSM_SET = new Set<string>(BIG7_TSM);

// ── Phase helpers ─────────────────────────────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
  X1: "bg-red-100 text-red-800 border-red-300",
  X2: "bg-red-200 text-red-900 border-red-400",
  X3: "bg-red-50 text-red-700 border-red-200",
  X4: "bg-orange-50 text-orange-700 border-orange-200",
  A1: "bg-red-100 text-red-700 border-red-300",
  A2: "bg-red-50 text-red-700 border-red-200",
  A3: "bg-rose-50 text-rose-700 border-rose-200",
  A4: "bg-rose-50 text-rose-600 border-rose-200",
  A5: "bg-orange-50 text-orange-600 border-orange-200",
  B1: "bg-red-200 text-red-800 border-red-400",
  B2: "bg-red-300 text-red-900 border-red-500",
  B3: "bg-red-400 text-red-950 border-red-600",
  B4: "bg-red-200 text-red-700 border-red-400",
  Y1: "bg-amber-100 text-amber-800 border-amber-300",
  Y2: "bg-amber-200 text-amber-900 border-amber-400",
  Y3: "bg-amber-100 text-amber-700 border-amber-200",
  Y4: "bg-yellow-50 text-yellow-700 border-yellow-200",
  C1: "bg-green-100 text-green-700 border-green-300",
  C2: "bg-green-100 text-green-600 border-green-200",
  C3: "bg-green-200 text-green-700 border-green-300",
  C4: "bg-green-200 text-green-800 border-green-400",
  C5: "bg-emerald-200 text-emerald-800 border-emerald-400",
  D1: "bg-emerald-100 text-emerald-700 border-emerald-300",
  D2: "bg-emerald-200 text-emerald-900 border-emerald-400",
  D3: "bg-emerald-100 text-emerald-600 border-emerald-300",
  D4: "bg-teal-100 text-teal-700 border-teal-300",
  MIXED: "bg-gray-100 text-gray-600 border-gray-200",
  UNKNOWN: "bg-gray-50 text-gray-400 border-gray-200",
};

const PHASE_EMOJI: Record<string, string> = {
  X1: "🔴", X2: "❤️", X3: "🟥", X4: "🟠",
  A1: "📈", A2: "📈", A3: "📊", A4: "📊", A5: "📊",
  B1: "⚠️", B2: "🔴", B3: "🔥", B4: "⚡",
  Y1: "🔻", Y2: "⛔", Y3: "📤", Y4: "🔶",
  C1: "📉", C2: "📉", C3: "📉", C4: "📉", C5: "📉",
  D1: "💀", D2: "💀", D3: "🌱", D4: "🔍",
  MIXED: "❓", UNKNOWN: "❔",
};

const PHASE_GROUP_LABEL: Record<string, string> = {
  BULLISH: "Bullish", PEAK: "Peak", TOP: "Top", BEARISH: "Bearish", BOTTOM: "Bottom", MIXED: "Mixed",
};

const getScoreBarColor = (score: number) => {
  if (score >= 80) return "bg-red-500";
  if (score >= 60) return "bg-rose-400";
  if (score >= 40) return "bg-yellow-400";
  if (score >= 25) return "bg-green-400";
  return "bg-emerald-400";
};

const fmt = (v: number | null, dec = 2) =>
  v !== null && v !== undefined ? v.toFixed(dec) : "—";

const sarBadge = (sar: string | null, count: number | null) => {
  if (sar === "low") {
    return (
      <span className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 tabular-nums">
        🔴 {count != null ? `+${count}` : "low"}
      </span>
    );
  }
  if (sar === "high") {
    return (
      <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 tabular-nums">
        🔵 {count != null ? `-${count}` : "high"}
      </span>
    );
  }
  return <span className="text-xs text-gray-400">—</span>;
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StockPage() {
  const [market, setMarket] = useState("TW");
  const [report, setReport] = useState<LatestReport | null>(null);
  const [legend, setLegend] = useState<PhaseLegendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [chartWindows, setChartWindows] = useState<{ symbol: string; stockName: string | null }[]>([]);
  const [dailyChartWindows, setDailyChartWindows] = useState<{ symbol: string; stockName: string | null }[]>([]);
  const [analysisWindows, setAnalysisWindows] = useState<{ symbol: string; stockName: string | null }[]>([]);
  const [topZSymbol, setTopZSymbol] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const openChartWindow = (symbol: string, stockName: string | null) => {
    setChartWindows(prev =>
      prev.some(w => w.symbol === symbol)
        ? prev
        : [...prev, { symbol, stockName }]
    );
    setTopZSymbol(symbol);
  };

  const closeChartWindow = (symbol: string) => {
    setChartWindows(prev => prev.filter(w => w.symbol !== symbol));
    setTopZSymbol(prev => (prev === symbol ? null : prev));
  };

  const openDailyChartWindow = (symbol: string, stockName: string | null) => {
    setDailyChartWindows(prev =>
      prev.some(w => w.symbol === symbol)
        ? prev
        : [...prev, { symbol, stockName }]
    );
    setTopZSymbol(`daily:${symbol}`);
  };

  const closeDailyChartWindow = (symbol: string) => {
    setDailyChartWindows(prev => prev.filter(w => w.symbol !== symbol));
    setTopZSymbol(prev => (prev === `daily:${symbol}` ? null : prev));
  };

  const openAnalysisWindow = (symbol: string, stockName: string | null) => {
    setAnalysisWindows(prev =>
      prev.some(w => w.symbol === symbol)
        ? prev
        : [...prev, { symbol, stockName }]
    );
    setTopZSymbol(`analysis:${symbol}`);
  };

  const closeAnalysisWindow = (symbol: string) => {
    setAnalysisWindows(prev => prev.filter(w => w.symbol !== symbol));
    setTopZSymbol(prev => (prev === `analysis:${symbol}` ? null : prev));
  };

  const fetchLatest = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetch(`/api/v1/stock/signals/latest?market=${market}`);
      const data = await res.json();
      setReport(data);
    } catch (_) {}
    if (!quiet) setLoading(false);
  }, [market]);

  const fetchLegend = async () => {
    try {
      const res = await fetch("/api/v1/stock/phases/legend");
      const data = await res.json();
      setLegend(data.phases || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchLatest();
    fetchLegend();
  }, [market]);

  // Poll for results after async trigger
  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/v1/stock/signals/latest?market=${market}`);
      const data = await res.json();
      if (data.date && data.count > 0) {
        setReport(data);
        setRunning(false);
        setRunStatus(`Analysis complete — ${data.count} signals as of ${data.date}`);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 15000);
  };

  const runAnalysis = async (mode: "sync" | "async") => {
    setRunning(true);
    setRunStatus(
      mode === "sync"
        ? "Running full analysis… this takes 3–5 minutes. Please wait."
        : "Analysis triggered in background — results will auto-refresh."
    );
    try {
      if (mode === "sync") {
        const res = await fetch(
          `/api/v1/stock/run-analysis?market=${market}&top_n=10&save_to_db=true`,
          { method: "POST" }
        );
        const data = await res.json();
        setRunStatus(data.message || "Done.");
        await fetchLatest(true);
        setRunning(false);
      } else {
        await fetch(
          `/api/v1/stock/run-analysis/async?market=${market}`,
          { method: "POST" }
        );
        startPolling();
      }
    } catch (e) {
      setRunStatus("Error triggering analysis. Check backend logs.");
      setRunning(false);
    }
  };

  const allSignals = report?.signals ?? [];
  const pinnedUS = market === "US"
    ? BIG7_TSM.map(sym => allSignals.find(s => s.symbol === sym)).filter(Boolean) as Signal[]
    : [];
  // US ranked pool: non-pinned stocks with positive slope only
  const rankedPool = market === "US"
    ? allSignals.filter(s => !BIG7_TSM_SET.has(s.symbol) && (s.slope_w10 ?? 0) > 0).slice(0, 10)
    : [];
  // TW: show all signals as-is (already sorted by score from API, no slope filter)
  const signals = market === "US" ? [...pinnedUS, ...rankedPool] : allSignals.slice(0, 10);

  const todayStr = new Date().toISOString().slice(0, 10);
  const staleDays = report?.date
    ? Math.floor((new Date(todayStr).getTime() - new Date(report.date).getTime()) / 86400000)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">← Home</Link>
            <span className="text-white font-bold text-lg">📈 ST125 Stock Engine</span>
            <span className="text-slate-400 text-xs hidden sm:inline">102.5 / Weekly MA Crossover Theory</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-lg overflow-hidden border border-slate-600">
              {["TW", "US"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMarket(m)}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    market === m
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {m === "TW" ? "🇹🇼 TW" : "🇺🇸 US"}
                </button>
              ))}
            </div>
            <button
              onClick={() => runAnalysis("async")}
              disabled={running}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              {running ? "⏳ Running…" : "▶ Run Analysis"}
            </button>
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              {showLegend ? "▲ Hide Legend" : "▼ Phase Legend"}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Status bar */}
        {runStatus && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
            running
              ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200"
              : runStatus.toLowerCase().includes("error")
              ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300"
              : "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300"
          }`}>
            {running && (
              <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
            <span>{runStatus}</span>
            {running && (
              <span className="ml-auto text-xs text-blue-500">Auto-refreshing every 15 s</span>
            )}
          </div>
        )}

        {/* Theory card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📐</div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">ST125 / 102.5 Theory</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Uses weekly SMA crossovers (W2/W10/W26/<span className="font-medium text-slate-700 dark:text-slate-200">W52</span>) + slope direction +
                Parabolic SAR to classify stocks into <span className="font-medium text-slate-700 dark:text-slate-200">6 phases / 28 sub-phases</span>.
                Higher score = better entry opportunity.
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="bg-slate-100 dark:bg-slate-700 rounded px-2 py-0.5">W52=D260 (1yr)</span>
                <span className="bg-slate-100 dark:bg-slate-700 rounded px-2 py-0.5">W26=D132 (6mo)</span>
                <span className="bg-slate-100 dark:bg-slate-700 rounded px-2 py-0.5">W10=D50 (10wk)</span>
                <span className="bg-slate-100 dark:bg-slate-700 rounded px-2 py-0.5">W2=D10 (2wk)</span>
                <span className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded px-2 py-0.5">🔴 SAR low = support</span>
                <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded px-2 py-0.5">🔵 SAR high = pressure</span>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Legend (collapsible) */}
        {showLegend && legend.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Phase Scoring Legend</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0 divide-x divide-y divide-slate-100 dark:divide-slate-700">
              {legend.filter(p => p.phase !== "UNKNOWN").map((p) => (
                <div key={p.phase} className="px-3 py-2.5 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border ${PHASE_COLORS[p.phase] || "bg-gray-100 text-gray-600"}`}>
                    {PHASE_EMOJI[p.phase]} {p.phase}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getScoreBarColor(p.base_score)}`}
                          style={{ width: `${p.base_score}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 w-5 text-right">{p.base_score}</span>
                    </div>
                    <div className="flex gap-1 mt-0.5">
                      {p.is_entry && <span className="text-[10px] text-red-600 font-medium">🎯 entry</span>}
                      {p.is_exit && <span className="text-[10px] text-green-600 font-medium">🚪 exit</span>}
                      {p.phase === "MIXED" && <span className="text-[10px] text-slate-400 italic">MA in transition</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-[11px] text-slate-400 dark:text-slate-500">
              ❓ <strong>Mixed</strong> = moving averages are in a transitional arrangement that doesn't match any of the 28 defined ST125 sub-phases. Score 25 — neutral, wait for clearer signal.
            </div>
            <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">ST125 / 102.5 Phase Diagram</div>
              <img
                src="/6_phases.png"
                alt="ST125 6-phase diagram"
                className="max-w-full rounded-lg border border-slate-200 shadow-sm"
                style={{ maxHeight: "420px", objectFit: "contain" }}
              />
            </div>
          </div>
        )}

        {/* Signals table */}
        {loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center py-24 text-slate-400 dark:text-slate-500">
            <svg className="animate-spin h-6 w-6 mr-3 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Loading signals…
          </div>
        ) : signals.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                  {market === "TW" ? "🇹🇼 Taiwan" : "🇺🇸 US"} — Top Signals
                  {market === "US" && <span className="ml-2 text-[11px] text-amber-600 font-normal">★ Big 7 + TSM always shown</span>}
                </h2>
                {report?.date && (
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>Signal date: {report.date}</span>
                    {staleDays > 0 && (
                      <span className="text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                        ⚠️ {staleDays} day{staleDays > 1 ? "s" : ""} old — run analysis to refresh
                      </span>
                    )}
                    <span>·{" "}{market === "US"
                      ? `${pinnedUS.length} pinned + ${rankedPool.length} ranked`
                      : `${signals.length} results`}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => fetchLatest()}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                ↻ Refresh
              </button>
            </div>

            {/* Desktop table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-8">#</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Symbol</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Phase</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-28">Score</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Close</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Vol 100M</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">EPS</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">W10</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">W26</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">W52</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">SAR</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">More</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {signals.map((s, i) => (
                    <React.Fragment key={s.symbol}>
                      {market === "US" && i === pinnedUS.length && pinnedUS.length > 0 && rankedPool.length > 0 && (
                        <tr key="divider-ranked">
                          <td colSpan={13} className="px-4 py-1.5 bg-slate-100 dark:bg-slate-700/50 border-y border-slate-200 dark:border-slate-700">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">
                              ↓ Top Signals (slope filter applied)
                            </span>
                          </td>
                        </tr>
                      )}
                      <tr
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors"
                        onClick={() => openChartWindow(s.symbol, s.stock_name)}
                        title={`Click to open weekly K-chart for ${s.symbol}`}
                      >
                        <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 font-medium">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{s.symbol}</span>
                            {market === "US" && BIG7_TSM_SET.has(s.symbol) && (
                              <span className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 rounded px-1 py-0.5">★</span>
                            )}
                          </div>
                          <div className="flex gap-1 mt-0.5">
                            {s.phase_label && ["X1","X2","X3","X4","A1","A2"].includes(s.phase_label) && (
                              <span className="text-[10px] text-red-600 font-semibold">🎯 Entry</span>
                            )}
                            {s.phase_label && ["Y1","Y2","Y3","Y4","C1","C2"].includes(s.phase_label) && (
                              <span className="text-[10px] text-green-600 font-semibold">🚪 Exit</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-[130px]">
                          <span className="text-sm text-slate-700 dark:text-slate-300 block truncate" title={s.stock_name || ""}>
                            {s.stock_name || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border ${PHASE_COLORS[s.phase_label] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                            {PHASE_EMOJI[s.phase_label] || "❔"} {s.phase_label || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden w-14">
                              <div
                                className={`h-full rounded-full transition-all ${getScoreBarColor(s.phase_score)}`}
                                style={{ width: `${s.phase_score}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-8 text-right">
                              {s.phase_score?.toFixed(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 font-mono text-xs">{fmt(s.close_price)}</td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 text-xs">{s.volume_amount_100m ? s.volume_amount_100m.toFixed(1) : "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-xs font-semibold ${s.eps !== null && s.eps !== undefined ? (s.eps >= 0 ? "text-red-600" : "text-green-600") : "text-slate-300"}`}>
                            {s.eps !== null && s.eps !== undefined ? s.eps.toFixed(2) : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className={`text-xs font-semibold ${(s.slope_w10 ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                            {s.slope_w10 !== null ? `${s.slope_w10 > 0 ? "+" : ""}${s.slope_w10.toFixed(2)}%` : "—"}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{fmt(s.w10)}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className={`text-xs font-semibold ${(s.slope_w26 ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                            {s.slope_w26 !== null ? `${s.slope_w26 > 0 ? "+" : ""}${s.slope_w26.toFixed(2)}%` : "—"}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{fmt(s.w26)}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className={`text-xs font-semibold ${(s.slope_w52 ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                            {s.slope_w52 !== null ? `${s.slope_w52 > 0 ? "+" : ""}${s.slope_w52.toFixed(2)}%` : "—"}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{fmt(s.w52)}</div>
                        </td>
                        <td className="px-4 py-3 text-center">{sarBadge(s.sar_signal, s.sar_count)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); openChartWindow(s.symbol, s.stock_name); }}
                              className="text-[11px] bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5 font-medium transition-colors"
                              title="Open weekly K-chart"
                            >📈 Weekly</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); openDailyChartWindow(s.symbol, s.stock_name); }}
                              className="text-[11px] bg-slate-100 dark:bg-slate-700 hover:bg-orange-100 dark:hover:bg-orange-900/40 hover:text-orange-700 dark:hover:text-orange-300 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5 font-medium transition-colors"
                              title="Open daily K-chart"
                            >📊 Daily</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); openAnalysisWindow(s.symbol, s.stock_name); }}
                              className="text-[11px] bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5 font-medium transition-colors"
                              title="Open K125 Analysis Table"
                            >🧮 Table</button>
                            <a
                              href={s.symbol.endsWith(".TW")
                                ? `https://tw.tradingview.com/chart/?symbol=TWSE%3A${s.symbol.replace(".TW","")}`
                                : `https://www.tradingview.com/chart/?symbol=${s.symbol}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-[11px] bg-slate-100 dark:bg-slate-700 hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:text-purple-700 dark:hover:text-purple-300 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5 font-medium transition-colors"
                              title="MA comparison on TradingView"
                            >🔀 Compare</a>
                            <a
                              href={`https://finance.yahoo.com/quote/${s.symbol}/financials/`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-[11px] bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5 font-medium transition-colors"
                              title="Financial statements on Yahoo Finance"
                            >📋 Statement</a>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
              {signals.map((s, i) => (
                <div
                  key={s.symbol}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                  onClick={() => openChartWindow(s.symbol, s.stock_name)}
                  title="Tap to open weekly K-chart"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 dark:text-slate-500 w-4">{i + 1}</span>
                      <div>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">{s.symbol}</span>
                        {market === "US" && BIG7_TSM_SET.has(s.symbol) && (
                          <span className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 rounded px-1 py-0.5">★</span>
                        )}
                        {s.stock_name && (
                          <span className="ml-1 text-xs text-slate-500">{s.stock_name}</span>
                        )}
                        <div className="flex gap-1 mt-0.5">
                          {s.phase_label && ["X1","X2","X3","X4","A1","A2"].includes(s.phase_label) && (
                            <span className="text-[10px] text-red-600 font-semibold">🎯 Entry</span>
                          )}
                          {s.phase_label && ["Y1","Y2","Y3","Y4","C1","C2"].includes(s.phase_label) && (
                            <span className="text-[10px] text-green-600 font-semibold">🚪 Exit</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border ${PHASE_COLORS[s.phase_label] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                        {PHASE_EMOJI[s.phase_label] || "❔"} {s.phase_label || "—"}
                      </span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{s.phase_score?.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div><span className="text-slate-400 dark:text-slate-500">Close</span><div className="font-mono font-medium text-slate-700 dark:text-slate-300">{fmt(s.close_price)}</div></div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500">W10</span>
                      <div className={`text-xs font-semibold ${(s.slope_w10 ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                        {s.slope_w10 !== null ? `${s.slope_w10 > 0 ? "+" : ""}${s.slope_w10.toFixed(2)}%` : "—"}
                      </div>
                      <div className="font-mono text-slate-500 dark:text-slate-400">{fmt(s.w10)}</div>
                    </div>
                    <div><span className="text-slate-400 dark:text-slate-500">SAR</span><div>{sarBadge(s.sar_signal, s.sar_count)}</div></div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openChartWindow(s.symbol, s.stock_name)}
                      className="text-[11px] bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5 font-medium"
                    >📈 Weekly</button>
                    <button
                      onClick={() => openDailyChartWindow(s.symbol, s.stock_name)}
                      className="text-[11px] bg-slate-100 dark:bg-slate-700 hover:bg-orange-100 dark:hover:bg-orange-900/40 hover:text-orange-700 dark:hover:text-orange-300 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5 font-medium"
                    >📊 Daily</button>
                    <button
                      onClick={() => openAnalysisWindow(s.symbol, s.stock_name)}
                      className="text-[11px] bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5 font-medium"
                    >🧮 Table</button>
                    <a
                      href={s.symbol.endsWith(".TW")
                        ? `https://tw.tradingview.com/chart/?symbol=TWSE%3A${s.symbol.replace(".TW","")}`
                        : `https://www.tradingview.com/chart/?symbol=${s.symbol}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-[11px] bg-slate-100 dark:bg-slate-700 hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:text-purple-700 dark:hover:text-purple-300 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5 font-medium"
                    >🔀 Compare</a>
                    <a
                      href={`https://finance.yahoo.com/quote/${s.symbol}/financials/`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-[11px] bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5 font-medium"
                    >📋 Statement</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 text-center px-6">
            <div className="text-5xl mb-4">📊</div>
            <p className="font-medium text-slate-600 dark:text-slate-300 mb-1">No signals yet for {market === "TW" ? "Taiwan" : "US"} market</p>
            <p className="text-sm mb-6">
              Click <strong>Run Analysis</strong> to fetch market data, compute ST125 phases,
              and rank the top opportunities.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => runAnalysis("async")}
                disabled={running}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                {running ? "⏳ Running…" : "▶ Run Analysis (background)"}
              </button>
              <button
                onClick={() => runAnalysis("sync")}
                disabled={running}
                className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Run (wait for result)
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Full market run takes 3–5 minutes · Results auto-refresh every 15 s
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
          ⚠️ <strong>Disclaimer:</strong> ST125 signals are for research and informational purposes only.
          They do not constitute financial advice. All investments carry risk.
          Please conduct your own due diligence before making any investment decisions.
        </div>
      </main>

      {/* Floating chart windows — rendered outside <main> to avoid z-index clipping */}
      {chartWindows.map((w, idx) => (
        <StockChartWindow
          key={w.symbol}
          symbol={w.symbol}
          stockName={w.stockName}
          onClose={() => closeChartWindow(w.symbol)}
          onFocus={() => setTopZSymbol(w.symbol)}
          zIndex={topZSymbol === w.symbol ? 60 : 50}
          initialOffset={idx}
        />
      ))}
      {dailyChartWindows.map((w, idx) => (
        <DailyChartWindow
          key={w.symbol}
          symbol={w.symbol}
          stockName={w.stockName}
          onClose={() => closeDailyChartWindow(w.symbol)}
          onFocus={() => setTopZSymbol(`daily:${w.symbol}`)}
          zIndex={topZSymbol === `daily:${w.symbol}` ? 65 : 55}
          initialOffset={idx + chartWindows.length}
        />
      ))}
      {analysisWindows.map((w, idx) => (
        <AnalysisTableWindow
          key={w.symbol}
          symbol={w.symbol}
          stockName={w.stockName}
          onClose={() => closeAnalysisWindow(w.symbol)}
          onFocus={() => setTopZSymbol(`analysis:${w.symbol}`)}
          zIndex={topZSymbol === `analysis:${w.symbol}` ? 70 : 60}
          initialOffset={idx + chartWindows.length + dailyChartWindows.length}
        />
      ))}
    </div>
  );
}
