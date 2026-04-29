"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Rnd } from "react-rnd";
import { useDarkMode } from "../hooks/useDarkMode";
import type {
  IChartApi,
  ISeriesApi,
  Time,
  SeriesMarker,
  MouseEventParams,
} from "lightweight-charts";

interface OHLCBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MAPoint {
  time: string;
  value: number;
}

interface SARPoint {
  time: string;
  value: number;
  signal: "low" | "high" | "unknown";
}

interface Fundamentals {
  market_cap?: number | null;
  pe_ratio?: number | null;
  eps?: number | null;
  week_52_high?: number | null;
  week_52_low?: number | null;
  revenue_ttm?: number | null;
  dividend_yield?: number | null;
  sector?: string | null;
  industry?: string | null;
  currency?: string | null;
  exchange?: string | null;
}

interface ChartData {
  symbol: string;
  stock_name: string | null;
  ohlcv: OHLCBar[];
  ma_lines: { d2: MAPoint[]; d10: MAPoint[]; d50: MAPoint[]; d132: MAPoint[] };
  sar: SARPoint[];
  fundamentals: Fundamentals;
}

interface OHLCTooltip {
  x: number;
  y: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Props {
  symbol: string;
  stockName: string | null;
  onClose: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  minimizedIdx?: number;
  zIndex?: number;
  onFocus?: () => void;
  initialOffset?: number;
  onOpenWeekly?: (symbol: string, stockName: string | null) => void;
  onOpenAnalysis?: (symbol: string, stockName: string | null) => void;
  onBringChartsToFront?: () => void;
}

function fmtBig(v: number | null | undefined): string {
  if (v == null) return "—";
  if (Math.abs(v) >= 1e12) return (v / 1e12).toFixed(2) + "T";
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(2) + "B";
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(2) + "M";
  return v.toFixed(2);
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return "—";
  return (v * 100).toFixed(2) + "%";
}

function fmtNum(v: number | null | undefined, dec = 2): string {
  if (v == null) return "—";
  return v.toFixed(dec);
}

function normalizeTime(t: Time | undefined): string {
  if (!t) return "";
  if (typeof t === "string") return t;
  if (typeof t === "number") {
    const d = new Date(t * 1000);
    return d.toISOString().slice(0, 10);
  }
  const bd = t as { year: number; month: number; day: number };
  return `${bd.year}-${String(bd.month).padStart(2, "0")}-${String(bd.day).padStart(2, "0")}`;
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export default function DailyChartWindow({
  symbol,
  stockName,
  onClose,
  onMinimize,
  isMinimized = false,
  minimizedIdx = 0,
  zIndex = 50,
  onFocus,
  initialOffset = 0,
  onOpenWeekly,
  onOpenAnalysis,
  onBringChartsToFront,
}: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<OHLCTooltip | null>(null);
  const [showFund, setShowFund] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [defaultSize] = useState(() => {
    if (typeof window === "undefined") return { x: 400, y: 68, width: 940, height: 520 };
    const hh = 68;
    const w40 = Math.round(window.innerWidth * 0.4);
    return { x: w40, y: hh, width: window.innerWidth - w40, height: window.innerHeight - hh };
  });
  const isMobile = useIsMobile();
  const isDark = useDarkMode();

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/v1/stock/${encodeURIComponent(symbol)}/chart-data/daily?days=365`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json() as Promise<ChartData>;
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, [symbol]);

  const buildChart = useCallback(() => {
    if (!data || !chartContainerRef.current) return;

    import("lightweight-charts").then(({ createChart, CrosshairMode }) => {
      if (!chartContainerRef.current) return;

      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      const container = chartContainerRef.current;
      const dark = document.documentElement.classList.contains("dark");
      const chart = createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        layout: {
          background: { color: dark ? "#1e293b" : "#ffffff" },
          textColor: dark ? "#e2e8f0" : "#334155",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: dark ? "#334155" : "#f1f5f9" },
          horzLines: { color: dark ? "#334155" : "#f1f5f9" },
        },
        rightPriceScale: { borderColor: dark ? "#475569" : "#e2e8f0" },
        timeScale: {
          borderColor: dark ? "#475569" : "#e2e8f0",
          timeVisible: true,
          fixLeftEdge: true,
          fixRightEdge: false,
        },
        crosshair: { mode: CrosshairMode.Normal },
        handleScroll: { mouseWheel: true, pressedMouseMove: true },
        handleScale: { mouseWheel: true, pinch: true },
      });
      chartRef.current = chart;

      const candleSeries = chart.addCandlestickSeries({
        upColor: "#ef4444",
        downColor: "#22c55e",
        borderUpColor: "#ef4444",
        borderDownColor: "#22c55e",
        wickUpColor: "#ef4444",
        wickDownColor: "#22c55e",
      });
      candleSeries.setData(data.ohlcv);
      candleSeriesRef.current = candleSeries;

      const volumeByTime = new Map<string, number>(
        data.ohlcv.map((b) => [b.time, b.volume])
      );

      // D2/D10/D50/D132 MA lines
      const maConfigs: { key: keyof ChartData["ma_lines"]; color: string; lineWidth: 1 | 2 }[] = [
        { key: "d2",   color: "#94a3b8", lineWidth: 1 },
        { key: "d10",  color: "#3b82f6", lineWidth: 1 },
        { key: "d50",  color: "#f97316", lineWidth: 2 },
        { key: "d132", color: "#a855f7", lineWidth: 2 },
      ];
      for (const cfg of maConfigs) {
        const lineData = data.ma_lines[cfg.key] ?? [];
        if (lineData.length > 0) {
          const ls = chart.addLineSeries({
            color: cfg.color,
            lineWidth: cfg.lineWidth,
            title: "",
            lastValueVisible: false,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
          });
          ls.setData(lineData);
        }
      }

      // SAR dots
      const sarMarkers: SeriesMarker<Time>[] = data.sar
        .filter((p) => p.signal === "low" || p.signal === "high")
        .map((p) => ({
          time: p.time as Time,
          position: p.signal === "low" ? "belowBar" : "aboveBar",
          color: p.signal === "low" ? "#ef4444" : "#3b82f6",
          shape: "circle" as const,
          size: 0.1,
          text: "",
        }));
      if (sarMarkers.length > 0) {
        candleSeries.setMarkers(sarMarkers);
      }

      // Show last ~120 bars (~6 months) right-aligned, matching weekly chart bar density
      const ohlcvLen = data.ohlcv.length;
      if (ohlcvLen > 0) {
        const visibleBars = 120;
        chart.timeScale().setVisibleLogicalRange({
          from: Math.max(-0.5, ohlcvLen - visibleBars - 0.5),
          to: ohlcvLen - 0.5 + 5,
        });
      }

      chart.subscribeCrosshairMove((param: MouseEventParams) => {
        if (!param.time || !param.point || !candleSeriesRef.current) {
          setTooltip(null);
          return;
        }
        const barData = param.seriesData.get(candleSeriesRef.current) as
          | { open: number; high: number; low: number; close: number }
          | undefined;
        if (!barData) { setTooltip(null); return; }
        const timeKey = normalizeTime(param.time);
        setTooltip({
          x: param.point.x,
          y: param.point.y,
          date: timeKey,
          open: barData.open,
          high: barData.high,
          low: barData.low,
          close: barData.close,
          volume: volumeByTime.get(timeKey) ?? 0,
        });
      });

      const observer = new ResizeObserver(() => {
        if (chartRef.current && chartContainerRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          });
        }
      });
      observer.observe(container);
      observerRef.current = observer;
    });
  }, [data, isDark]);

  useEffect(() => {
    buildChart();
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      chartRef.current?.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [buildChart]);

  // Update chart colors when dark mode changes (without full rebuild)
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      layout: {
        background: { color: isDark ? "#1e293b" : "#ffffff" },
        textColor: isDark ? "#e2e8f0" : "#334155",
      },
      grid: {
        vertLines: { color: isDark ? "#334155" : "#f1f5f9" },
        horzLines: { color: isDark ? "#334155" : "#f1f5f9" },
      },
      rightPriceScale: { borderColor: isDark ? "#475569" : "#e2e8f0" },
      timeScale: { borderColor: isDark ? "#475569" : "#e2e8f0" },
    });
  }, [isDark]);

  const fundamentals = data?.fundamentals ?? {};
  const fundRows: [string, string][] = [
    ["Market Cap",  fmtBig(fundamentals.market_cap)],
    ["P/E Ratio",   fmtNum(fundamentals.pe_ratio, 1)],
    ["EPS",         fmtNum(fundamentals.eps, 2)],
    ["52-Wk High",  fmtNum(fundamentals.week_52_high, 2)],
    ["52-Wk Low",   fmtNum(fundamentals.week_52_low, 2)],
    ["Revenue TTM", fmtBig(fundamentals.revenue_ttm)],
    ["Div. Yield",  fmtPct(fundamentals.dividend_yield)],
    ["Sector",      fundamentals.sector ?? "—"],
    ["Industry",    fundamentals.industry ?? "—"],
    ["Currency",    fundamentals.currency ?? "—"],
  ];

  const innerContent = (
    <div
      className="flex flex-col w-full h-full bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700"
      onMouseDown={onFocus}
    >
      <div className="chart-drag-handle flex items-center justify-between pl-4 pr-3 py-2 bg-orange-900 text-white flex-shrink-0 cursor-move select-none">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono font-bold text-sm text-white">{symbol}</span>
          {(data?.stock_name ?? stockName) && (
            <span className="text-orange-200 text-xs truncate">
              {data?.stock_name ?? stockName}
            </span>
          )}
          <span className="text-orange-300 text-[11px] hidden sm:inline">· Daily K-Chart</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="relative" ref={menuRef}>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setShowMenu(m => !m)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-orange-700 text-orange-200 hover:text-white transition-colors text-sm leading-none"
              title="Menu"
            >⋮</button>
            {showMenu && (
              <div className="absolute right-0 top-7 bg-white dark:bg-slate-700 rounded-lg shadow-xl border border-slate-200 dark:border-slate-600 py-1 min-w-[172px] z-10">
                <button
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => { setShowFund(f => !f); setShowMenu(false); }}
                >📊 Fundamentals</button>
                <button
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => { onOpenAnalysis?.(symbol, data?.stock_name ?? stockName); setShowMenu(false); }}
                >🧮 Analysis Table</button>
                <button
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => { onOpenWeekly?.(symbol, data?.stock_name ?? stockName); setShowMenu(false); }}
                >📈 Open Weekly Chart</button>
              </div>
            )}
          </div>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onMinimize}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-orange-700 text-orange-200 hover:text-white transition-colors text-lg leading-none"
            title="Minimize"
          >−</button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-orange-700 text-orange-200 hover:text-white transition-colors text-base leading-none"
            title="Close"
          >✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
            <svg className="animate-spin h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span className="text-sm">Loading daily chart data…</span>
            <span className="text-xs text-slate-400">Fetching 1 year of daily data from Yahoo Finance</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-2">
            <span className="text-2xl">⚠️</span>
            <p className="text-sm text-red-600 font-medium">Failed to load chart</p>
            <p className="text-xs text-slate-500">{error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className="flex items-center gap-3 px-3 py-1.5 bg-orange-50 dark:bg-slate-700/60 border-b border-orange-100 dark:border-slate-700 text-xs flex-shrink-0 flex-wrap">
              {([
                { label: "D2",   color: "#94a3b8" },
                { label: "D10",  color: "#3b82f6" },
                { label: "D50",  color: "#f97316" },
                { label: "D132", color: "#a855f7" },
              ] as const).map(({ label, color }) => (
                <span key={label} className="flex items-center gap-1">
                  <span className="inline-block w-5 h-0.5 rounded" style={{ backgroundColor: color }} />
                  <span className="text-slate-600 dark:text-slate-300">{label}</span>
                </span>
              ))}
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                <span className="text-slate-500 dark:text-slate-400">SAR low</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-slate-500 dark:text-slate-400">SAR high</span>
              </span>
              <span className="ml-auto text-slate-400 dark:text-slate-500 hidden sm:inline">🔴 up · 🟢 down (Chinese convention)</span>
            </div>

            <div className="flex-1 min-h-0 relative">
              <div ref={chartContainerRef} className="absolute inset-0" />
              {tooltip && (
                <div
                  className="absolute pointer-events-none z-10 bg-slate-800 text-white rounded-lg px-3 py-2 shadow-xl text-xs leading-relaxed"
                  style={{
                    left: Math.min(tooltip.x + 14, (chartContainerRef.current?.clientWidth ?? 900) - 165),
                    top: Math.max(tooltip.y - 90, 6),
                  }}
                >
                  <div className="font-semibold text-slate-200 mb-1">{tooltip.date}</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    <span className="text-slate-400">O</span><span className="font-mono">{tooltip.open.toFixed(2)}</span>
                    <span className="text-slate-400">H</span><span className="font-mono text-red-400">{tooltip.high.toFixed(2)}</span>
                    <span className="text-slate-400">L</span><span className="font-mono text-green-400">{tooltip.low.toFixed(2)}</span>
                    <span className="text-slate-400">C</span>
                    <span className={`font-mono font-bold ${tooltip.close >= tooltip.open ? "text-red-400" : "text-green-400"}`}>
                      {tooltip.close.toFixed(2)}
                    </span>
                    <span className="text-slate-400">Vol</span><span className="font-mono">{fmtBig(tooltip.volume)}</span>
                  </div>
                </div>
              )}
            </div>

            {showFund && <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-700 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50">
              <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                Fundamentals · {data.symbol}
                {fundamentals.currency ? ` (${fundamentals.currency})` : ""}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-6 gap-y-1.5">
                {fundRows.map(([label, value]) => (
                  <div key={label}>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">{label}</div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate" title={value}>{value}</div>
                  </div>
                ))}
              </div>
            </div>}
          </>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 flex flex-col" style={{ zIndex }}>
        {innerContent}
      </div>
    );
  }

  // ── Minimized: small pill at top-right corner ─────────────────────────────
  if (isMinimized) {
    const topPx = 72 + minimizedIdx * 34;
    return (
      <div
        className="fixed right-2 pointer-events-auto"
        style={{ top: topPx, zIndex }}
        onMouseDown={() => { onFocus?.(); onBringChartsToFront?.(); }}
      >
        <div className="flex items-center gap-1.5 bg-orange-900 border border-orange-700 text-white rounded-lg px-2.5 py-1.5 shadow-lg select-none cursor-pointer">
          <span className="text-[11px] font-mono font-bold">D·{symbol}</span>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onMinimize}
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-orange-700 text-orange-200 text-[10px]"
            title="Restore"
          >□</button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-red-700 text-orange-200 text-[10px]"
            title="Close"
          >✕</button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="fixed inset-0 flex flex-col" style={{ zIndex }}>
        {innerContent}
      </div>
    );
  }

  const resizeGrip = (
    <div className="absolute bottom-1 right-1 w-4 h-4 flex items-center justify-center cursor-se-resize opacity-30 hover:opacity-70 transition-opacity pointer-events-auto select-none">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-slate-400">
        <path d="M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M9 5L5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M9 9H5L9 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex }}>
      <Rnd
        default={defaultSize}
        minWidth={400}
        minHeight={300}
        bounds="parent"
        dragHandleClassName="chart-drag-handle"
        className="pointer-events-auto"
        onMouseDown={(e) => { (e as React.MouseEvent).stopPropagation(); onFocus?.(); onBringChartsToFront?.(); }}
        resizeHandleStyles={{
          bottomRight: { width: 20, height: 20, right: 0, bottom: 0, cursor: "se-resize" },
          bottom: { cursor: "s-resize" },
          right: { cursor: "e-resize" },
          left: { cursor: "w-resize" },
          top: { cursor: "n-resize" },
          topRight: { cursor: "ne-resize" },
          topLeft: { cursor: "nw-resize" },
          bottomLeft: { cursor: "sw-resize" },
        }}
      >
        <div className="relative w-full h-full">
          {innerContent}
          {resizeGrip}
        </div>
      </Rnd>
    </div>
  );
}
