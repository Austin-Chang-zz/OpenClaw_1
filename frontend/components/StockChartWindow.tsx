"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Rnd } from "react-rnd";
import type {
  IChartApi,
  ISeriesApi,
  Time,
  SeriesMarker,
  MouseEventParams,
} from "lightweight-charts";

// ── Data types ─────────────────────────────────────────────────────────────────

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
  ma_lines: { w2: MAPoint[]; w10: MAPoint[]; w26: MAPoint[]; w52: MAPoint[] };
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
  zIndex?: number;
  onFocus?: () => void;
  initialOffset?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

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

// ── StockChartWindow ───────────────────────────────────────────────────────────

export default function StockChartWindow({
  symbol,
  stockName,
  onClose,
  zIndex = 50,
  onFocus,
  initialOffset = 0,
}: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<OHLCTooltip | null>(null);
  const isMobile = useIsMobile();

  // Fetch chart data
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/v1/stock/${encodeURIComponent(symbol)}/chart-data`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json() as Promise<ChartData>;
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, [symbol]);

  // Build/rebuild chart when data arrives
  const buildChart = useCallback(() => {
    if (!data || !chartContainerRef.current) return;

    import("lightweight-charts").then(({ createChart, CrosshairMode }) => {
      if (!chartContainerRef.current) return;

      // Tear down previous chart if any
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
      const chart = createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        layout: {
          background: { color: "#ffffff" },
          textColor: "#334155",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "#f1f5f9" },
          horzLines: { color: "#f1f5f9" },
        },
        rightPriceScale: { borderColor: "#e2e8f0" },
        timeScale: {
          borderColor: "#e2e8f0",
          timeVisible: false,
          fixLeftEdge: true,
          fixRightEdge: true,
        },
        crosshair: { mode: CrosshairMode.Normal },
        handleScroll: { mouseWheel: true, pressedMouseMove: true },
        handleScale: { mouseWheel: true, pinch: true },
      });
      chartRef.current = chart;

      // Candlestick series — Chinese convention: red up, green down
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

      // Volume lookup map for tooltip
      const volumeByTime = new Map<string, number>(
        data.ohlcv.map((b) => [b.time, b.volume])
      );

      // MA overlay lines
      const maConfigs: { key: keyof ChartData["ma_lines"]; color: string; lineWidth: 1 | 2; title: string }[] = [
        { key: "w2",  color: "#94a3b8", lineWidth: 1, title: "W2"  },
        { key: "w10", color: "#3b82f6", lineWidth: 2, title: "W10" },
        { key: "w26", color: "#f97316", lineWidth: 2, title: "W26" },
        { key: "w52", color: "#ef4444", lineWidth: 2, title: "W52" },
      ];
      for (const cfg of maConfigs) {
        const lineData = data.ma_lines[cfg.key] ?? [];
        if (lineData.length > 0) {
          const ls = chart.addLineSeries({
            color: cfg.color,
            lineWidth: cfg.lineWidth,
            title: cfg.title,
            lastValueVisible: false,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
          });
          ls.setData(lineData);
        }
      }

      // SAR markers on candlestick series
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

      chart.timeScale().fitContent();

      // OHLC hover tooltip — subscribe to crosshair move
      chart.subscribeCrosshairMove((param: MouseEventParams) => {
        if (!param.time || !param.point || !candleSeriesRef.current) {
          setTooltip(null);
          return;
        }
        const barData = param.seriesData.get(candleSeriesRef.current) as
          | { open: number; high: number; low: number; close: number }
          | undefined;
        if (!barData) {
          setTooltip(null);
          return;
        }
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

      // Resize observer
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
  }, [data]);

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

  // ── Shared inner content ───────────────────────────────────────────────────

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
      className="flex flex-col w-full h-full bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-200"
      onMouseDown={onFocus}
    >
      {/* Title bar / drag handle */}
      <div className="chart-drag-handle flex items-center justify-between pl-4 pr-3 py-2 bg-slate-800 text-white flex-shrink-0 cursor-move select-none">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono font-bold text-sm text-white">{symbol}</span>
          {(data?.stock_name ?? stockName) && (
            <span className="text-slate-300 text-xs truncate">
              {data?.stock_name ?? stockName}
            </span>
          )}
          <span className="text-slate-500 text-[11px] hidden sm:inline">
            · Weekly K-Chart
          </span>
        </div>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="ml-3 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-slate-600 text-slate-300 hover:text-white transition-colors text-base leading-none"
          title="Close"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
            <svg
              className="animate-spin h-6 w-6 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-sm">Loading weekly chart data…</span>
            <span className="text-xs text-slate-400">
              Fetching 2 years of data from Yahoo Finance
            </span>
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
            {/* MA legend */}
            <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-xs flex-shrink-0 flex-wrap">
              {(
                [
                  { label: "W2",  color: "#94a3b8" },
                  { label: "W10", color: "#3b82f6" },
                  { label: "W26", color: "#f97316" },
                  { label: "W52", color: "#ef4444" },
                ] as const
              ).map(({ label, color }) => (
                <span key={label} className="flex items-center gap-1">
                  <span
                    className="inline-block w-5 h-0.5 rounded"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-slate-600">{label}</span>
                </span>
              ))}
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                <span className="text-slate-500">SAR low</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-slate-500">SAR high</span>
              </span>
              <span className="ml-auto text-slate-400 hidden sm:inline">
                🔴 up · 🟢 down (Chinese convention)
              </span>
            </div>

            {/* Chart canvas with OHLC tooltip overlay */}
            <div className="flex-1 min-h-0 relative">
              <div ref={chartContainerRef} className="absolute inset-0" />

              {/* OHLC crosshair tooltip */}
              {tooltip && (
                <div
                  className="absolute pointer-events-none z-10 bg-slate-800 text-white rounded-lg px-3 py-2 shadow-xl text-xs leading-relaxed"
                  style={{
                    left: Math.min(
                      tooltip.x + 14,
                      (chartContainerRef.current?.clientWidth ?? 900) - 165
                    ),
                    top: Math.max(tooltip.y - 90, 6),
                  }}
                >
                  <div className="font-semibold text-slate-200 mb-1">{tooltip.date}</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    <span className="text-slate-400">O</span>
                    <span className="font-mono">{tooltip.open.toFixed(2)}</span>
                    <span className="text-slate-400">H</span>
                    <span className="font-mono text-red-400">{tooltip.high.toFixed(2)}</span>
                    <span className="text-slate-400">L</span>
                    <span className="font-mono text-green-400">{tooltip.low.toFixed(2)}</span>
                    <span className="text-slate-400">C</span>
                    <span
                      className={`font-mono font-bold ${tooltip.close >= tooltip.open ? "text-red-400" : "text-green-400"}`}
                    >
                      {tooltip.close.toFixed(2)}
                    </span>
                    <span className="text-slate-400">Vol</span>
                    <span className="font-mono">{fmtBig(tooltip.volume)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Fundamentals panel */}
            <div className="flex-shrink-0 border-t border-slate-100 px-4 py-2.5 bg-slate-50">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                Fundamentals · {data.symbol}
                {fundamentals.currency ? ` (${fundamentals.currency})` : ""}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-6 gap-y-1.5">
                {fundRows.map(([label, value]) => (
                  <div key={label}>
                    <div className="text-[10px] text-slate-400">{label}</div>
                    <div
                      className="text-xs font-semibold text-slate-700 truncate"
                      title={value}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ── Mobile: full-screen modal ──────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="fixed inset-0 flex flex-col" style={{ zIndex }}>
        {innerContent}
      </div>
    );
  }

  // ── Desktop: draggable + resizable floating window ─────────────────────────
  const x = 60 + initialOffset * 30;
  const y = 60 + initialOffset * 30;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex }}>
      <Rnd
        default={{ x, y, width: 940, height: 580 }}
        minWidth={640}
        minHeight={420}
        bounds="parent"
        dragHandleClassName="chart-drag-handle"
        className="pointer-events-auto"
        onMouseDown={onFocus}
      >
        {innerContent}
      </Rnd>
    </div>
  );
}
