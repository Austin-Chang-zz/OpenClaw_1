"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const StockChartWindow = dynamic(() => import("../../components/StockChartWindow"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

interface Signal {
  symbol: string;
  stock_name: string | null;
  phase_label: string;
  phase_score: number;
  close_price: number | null;
  volume_amount_100m: number | null;
  w10: number | null;
  w26: number | null;
  w52: number | null;
  slope_w10: number | null;
  slope_w26: number | null;
  slope_w52: number | null;
  sar_signal: string | null;
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

// ── Phase helpers ─────────────────────────────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
  X1: "bg-red-100 text-red-800 border-red-300",
  X2: "bg-red-200 text-red-900 border-red-400",
  A1: "bg-red-100 text-red-700 border-red-300",
  A2: "bg-red-50 text-red-700 border-red-200",
  A3: "bg-rose-50 text-rose-700 border-rose-200",
  A4: "bg-rose-50 text-rose-600 border-rose-200",
  A5: "bg-orange-50 text-orange-600 border-orange-200",
  B1: "bg-red-200 text-red-800 border-red-400",
  B2: "bg-red-300 text-red-900 border-red-500",
  Y1: "bg-amber-100 text-amber-800 border-amber-300",
  Y2: "bg-amber-200 text-amber-900 border-amber-400",
  C1: "bg-green-100 text-green-700 border-green-300",
  C2: "bg-green-100 text-green-600 border-green-200",
  C3: "bg-green-200 text-green-700 border-green-300",
  C4: "bg-green-200 text-green-800 border-green-400",
  C5: "bg-emerald-200 text-emerald-800 border-emerald-400",
  D1: "bg-emerald-100 text-emerald-700 border-emerald-300",
  D2: "bg-emerald-200 text-emerald-900 border-emerald-400",
  MIXED: "bg-gray-100 text-gray-600 border-gray-200",
  UNKNOWN: "bg-gray-50 text-gray-400 border-gray-200",
};

const PHASE_EMOJI: Record<string, string> = {
  X1: "🔴", X2: "❤️",
  A1: "📈", A2: "📈", A3: "📊", A4: "📊", A5: "📊",
  B1: "⚠️", B2: "🔴",
  Y1: "🔻", Y2: "⛔",
  C1: "📉", C2: "📉", C3: "📉", C4: "📉", C5: "📉",
  D1: "💀", D2: "💀",
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

const sarBadge = (sar: string | null) => {
  if (sar === "low") return <span className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">🔴 low</span>;
  if (sar === "high") return <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">🔵 high</span>;
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

  const signals = (report?.signals || []).filter(s => (s.slope_w10 ?? 0) > 0);

  return (
    <div className="min-h-screen bg-gray-50">
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Status bar */}
        {runStatus && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
            running
              ? "bg-blue-50 border-blue-200 text-blue-800"
              : runStatus.toLowerCase().includes("error")
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📐</div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">ST125 / 102.5 Theory</h3>
              <p className="text-sm text-slate-600">
                Uses weekly SMA crossovers (W2/W10/W26/<span className="font-medium text-slate-700">W52</span>) + slope direction +
                Parabolic SAR to classify stocks into 14 sub-phases.
                Higher score = better entry opportunity.
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="bg-slate-100 rounded px-2 py-0.5">W52=D260 (1yr)</span>
                <span className="bg-slate-100 rounded px-2 py-0.5">W26=D132 (6mo)</span>
                <span className="bg-slate-100 rounded px-2 py-0.5">W10=D50 (10wk)</span>
                <span className="bg-slate-100 rounded px-2 py-0.5">W2=D10 (2wk)</span>
                <span className="bg-red-50 text-red-700 rounded px-2 py-0.5">🔴 SAR low = support</span>
                <span className="bg-blue-50 text-blue-700 rounded px-2 py-0.5">🔵 SAR high = pressure</span>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Legend (collapsible) */}
        {showLegend && legend.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-700 text-sm">Phase Scoring Legend</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0 divide-x divide-y divide-slate-100">
              {legend.filter(p => p.phase !== "MIXED" && p.phase !== "UNKNOWN").map((p) => (
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
                      <span className="text-xs text-slate-500 w-5 text-right">{p.base_score}</span>
                    </div>
                    <div className="flex gap-1 mt-0.5">
                      {p.is_entry && <span className="text-[10px] text-red-600 font-medium">🎯 entry</span>}
                      {p.is_exit && <span className="text-[10px] text-green-600 font-medium">🚪 exit</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signals table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center py-24 text-slate-400">
            <svg className="animate-spin h-6 w-6 mr-3 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Loading signals…
          </div>
        ) : signals.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-800 text-sm">
                  {market === "TW" ? "🇹🇼 Taiwan" : "🇺🇸 US"} — Top Signals
                </h2>
                {report?.date && (
                  <p className="text-xs text-slate-500 mt-0.5">Signal date: {report.date} · {signals.length} results</p>
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
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-8">#</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Symbol</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Phase</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Score</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Close</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vol 100M</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">W10</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">W26</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">W52</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">SAR</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Crossover</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {signals.map((s, i) => (
                    <React.Fragment key={s.symbol}>
                      <tr
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => openChartWindow(s.symbol, s.stock_name)}
                        title={`Click to open weekly K-chart for ${s.symbol}`}
                      >
                        <td className="px-4 py-3 text-xs text-slate-400 font-medium">{i + 1}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-slate-800">{s.symbol}</span>
                          <div className="flex gap-1 mt-0.5">
                            {s.phase_label && ["X1","X2","A1","A2"].includes(s.phase_label) && (
                              <span className="text-[10px] text-red-600 font-semibold">🎯 Entry</span>
                            )}
                            {s.phase_label && ["Y1","Y2","C1","C2"].includes(s.phase_label) && (
                              <span className="text-[10px] text-green-600 font-semibold">🚪 Exit</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-[130px]">
                          <span className="text-sm text-slate-700 block truncate" title={s.stock_name || ""}>
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
                            <span className="text-xs font-semibold text-slate-700 w-8 text-right">
                              {s.phase_score?.toFixed(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 font-mono text-xs">{fmt(s.close_price)}</td>
                        <td className="px-4 py-3 text-right text-slate-500 text-xs">{s.volume_amount_100m ? s.volume_amount_100m.toFixed(1) : "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className={`text-xs font-semibold ${(s.slope_w10 ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                            {s.slope_w10 !== null ? `${s.slope_w10 > 0 ? "+" : ""}${s.slope_w10.toFixed(2)}%` : "—"}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">{fmt(s.w10)}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className={`text-xs font-semibold ${(s.slope_w26 ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                            {s.slope_w26 !== null ? `${s.slope_w26 > 0 ? "+" : ""}${s.slope_w26.toFixed(2)}%` : "—"}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">{fmt(s.w26)}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className={`text-xs font-semibold ${(s.slope_w52 ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                            {s.slope_w52 !== null ? `${s.slope_w52 > 0 ? "+" : ""}${s.slope_w52.toFixed(2)}%` : "—"}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">{fmt(s.w52)}</div>
                        </td>
                        <td className="px-4 py-3 text-center">{sarBadge(s.sar_signal)}</td>
                        <td className="px-4 py-3">
                          {s.crossover_event ? (
                            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded px-1.5 py-0.5 font-mono">
                              {s.crossover_event.replace(/_/g, " ")}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {signals.map((s, i) => (
                <div
                  key={s.symbol}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => openChartWindow(s.symbol, s.stock_name)}
                  title="Tap to open weekly K-chart"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-4">{i + 1}</span>
                      <div>
                        <span className="font-mono font-bold text-slate-800 text-sm">{s.symbol}</span>
                        {s.stock_name && (
                          <span className="ml-1.5 text-xs text-slate-500">{s.stock_name}</span>
                        )}
                        <div className="flex gap-1 mt-0.5">
                          {s.phase_label && ["X1","X2","A1","A2"].includes(s.phase_label) && (
                            <span className="text-[10px] text-red-600 font-semibold">🎯 Entry</span>
                          )}
                          {s.phase_label && ["Y1","Y2","C1","C2"].includes(s.phase_label) && (
                            <span className="text-[10px] text-green-600 font-semibold">🚪 Exit</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border ${PHASE_COLORS[s.phase_label] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                        {PHASE_EMOJI[s.phase_label] || "❔"} {s.phase_label || "—"}
                      </span>
                      <span className="text-sm font-bold text-slate-700">{s.phase_score?.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-500">
                    <div><span className="text-slate-400">Close</span><div className="font-mono font-medium text-slate-700">{fmt(s.close_price)}</div></div>
                    <div>
                      <span className="text-slate-400">W10</span>
                      <div className={`text-xs font-semibold ${(s.slope_w10 ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                        {s.slope_w10 !== null ? `${s.slope_w10 > 0 ? "+" : ""}${s.slope_w10.toFixed(2)}%` : "—"}
                      </div>
                      <div className="font-mono text-slate-500">{fmt(s.w10)}</div>
                    </div>
                    <div><span className="text-slate-400">SAR</span><div>{sarBadge(s.sar_signal)}</div></div>
                  </div>
                  {s.explanation && (
                    <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">{s.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 text-slate-400 text-center px-6">
            <div className="text-5xl mb-4">📊</div>
            <p className="font-medium text-slate-600 mb-1">No signals yet for {market === "TW" ? "Taiwan" : "US"} market</p>
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
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
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
          market={market}
          onClose={() => closeChartWindow(w.symbol)}
          onFocus={() => setTopZSymbol(w.symbol)}
          zIndex={topZSymbol === w.symbol ? 60 : 50}
          initialOffset={idx}
        />
      ))}
    </div>
  );
}
