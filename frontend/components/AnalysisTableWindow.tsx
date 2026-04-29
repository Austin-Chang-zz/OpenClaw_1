"use client";

import React, { useEffect, useState } from "react";
import { Rnd } from "react-rnd";

interface WeeklyRow {
  phase_label: string | null;
  slope_w26: number | null;
  slope_w10: number | null;
  slope_w2: number | null;
  cross_w2_w10: number;
  cross_w2_w26: number;
  cross_w10_w26: number;
  sar_count: number;
  pvcnt: number;
}

interface DailyRow {
  slope_d132: number | null;
  slope_d50: number | null;
  slope_d10: number | null;
  cross_d10_d50: number;
  cross_d10_d132: number;
  cross_d50_d132: number;
  sar_count: number;
  pvcnt: number;
}

interface AnalysisData {
  symbol: string;
  stock_name: string;
  weekly: WeeklyRow;
  daily: DailyRow;
}

interface Props {
  symbol: string;
  stockName: string | null;
  onClose: () => void;
  zIndex?: number;
  onFocus?: () => void;
  initialOffset?: number;
}

function useIsMobile() {
  const [m, setM] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const h = (e: MediaQueryListEvent) => setM(e.matches);
    setM(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return m;
}

function NumCell({ v, suffix = "" }: { v: number | null | undefined; suffix?: string }) {
  if (v == null) return <span className="text-gray-500">—</span>;
  const pos = v > 0;
  const neg = v < 0;
  return (
    <span className={pos ? "text-red-400" : neg ? "text-green-400" : "text-gray-400"}>
      {pos ? `+${v}${suffix}` : `${v}${suffix}`}
    </span>
  );
}

function SlopeCell({ v }: { v: number | null }) {
  if (v == null) return <span className="text-gray-500">—</span>;
  const pos = v > 0;
  const neg = v < 0;
  const arrow = pos ? "↑" : neg ? "↓" : "→";
  const cls = pos ? "text-red-400" : neg ? "text-green-400" : "text-gray-400";
  return (
    <span className={cls}>
      {pos ? "+" : ""}{v.toFixed(1)}{arrow}
    </span>
  );
}

function LoadingRows() {
  return (
    <>
      {["Weekly", "Daily"].map(r => (
        <tr key={r} className="border-t border-gray-700">
          <td className="px-3 py-3 text-gray-500 text-xs">{r}</td>
          {Array.from({ length: 8 }, (_, i) => (
            <td key={i} className="px-3 py-3 text-center">
              <span className="inline-block w-8 h-3 bg-gray-700 rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function AnalysisTableWindow({
  symbol,
  stockName,
  onClose,
  zIndex = 60,
  onFocus,
  initialOffset = 0,
}: Props) {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/v1/stock/${encodeURIComponent(symbol)}/analysis-table`)
      .then(r => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json() as Promise<AnalysisData>;
      })
      .then(d => { setData(d); setLoading(false); })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, [symbol]);

  const w = data?.weekly;
  const d = data?.daily;
  const title = `${symbol} ${data?.stock_name ?? stockName ?? ""} Analysis Table`;

  const innerContent = (
    <div
      className="flex flex-col w-full h-full rounded-xl overflow-hidden shadow-2xl border border-gray-700"
      style={{ background: "#111318" }}
      onMouseDown={onFocus}
    >
      {/* Title bar */}
      <div
        className="analysis-drag-handle flex items-center justify-between px-4 py-2 flex-shrink-0 select-none cursor-move"
        style={{ background: "#1c1f27", borderBottom: "1px solid #2a2d38" }}
      >
        <span className="text-white font-semibold text-sm truncate">{title}</span>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={onClose}
          className="ml-3 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm"
          title="Close"
        >✕</button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full text-xs border-collapse" style={{ minWidth: 740 }}>
          <thead>
            <tr style={{ background: "#1c1f27" }}>
              <th className="px-3 py-2.5 text-left text-gray-400 font-semibold w-16">
                {w?.phase_label ?? "—"}
              </th>
              {/* Slope columns */}
              <th className="px-3 py-2 text-center text-gray-400 font-medium">
                <div>W26</div><div className="text-gray-600">D132</div>
              </th>
              <th className="px-3 py-2 text-center text-gray-400 font-medium">
                <div>W10</div><div className="text-gray-600">D50</div>
              </th>
              <th className="px-3 py-2 text-center text-gray-400 font-medium">
                <div>W2</div><div className="text-gray-600">D10</div>
              </th>
              {/* Crossover columns */}
              <th className="px-3 py-2 text-center text-gray-400 font-medium">
                <div>W2×W10</div><div className="text-gray-600">D10×D50</div>
              </th>
              <th className="px-3 py-2 text-center text-gray-400 font-medium">
                <div>W2×W26</div><div className="text-gray-600">D10×D132</div>
              </th>
              <th className="px-3 py-2 text-center text-gray-400 font-medium">
                <div>W10×W26</div><div className="text-gray-600">D50×D132</div>
              </th>
              {/* SAR count */}
              <th className="px-3 py-2 text-center text-gray-400 font-medium">
                SAR dot count
              </th>
              {/* pvcnt */}
              <th className="px-3 py-2 text-center text-gray-400 font-medium">
                <div>W2 pvcnt</div><div className="text-gray-600">D2 pvcnt</div>
              </th>
            </tr>
          </thead>
          <tbody style={{ color: "#d1d5db" }}>
            {loading ? (
              <LoadingRows />
            ) : error ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-red-400 text-xs">{error}</td>
              </tr>
            ) : (
              <>
                {/* Weekly row */}
                <tr className="border-t border-gray-700/60 hover:bg-white/5 transition-colors">
                  <td className="px-3 py-3 text-gray-300 font-medium">Weekly</td>
                  <td className="px-3 py-3 text-center font-mono"><SlopeCell v={w?.slope_w26 ?? null} /></td>
                  <td className="px-3 py-3 text-center font-mono"><SlopeCell v={w?.slope_w10 ?? null} /></td>
                  <td className="px-3 py-3 text-center font-mono"><SlopeCell v={w?.slope_w2 ?? null} /></td>
                  <td className="px-3 py-3 text-center font-mono"><NumCell v={w?.cross_w2_w10} /></td>
                  <td className="px-3 py-3 text-center font-mono"><NumCell v={w?.cross_w2_w26} /></td>
                  <td className="px-3 py-3 text-center font-mono"><NumCell v={w?.cross_w10_w26} /></td>
                  <td className="px-3 py-3 text-center font-mono"><NumCell v={w?.sar_count} /></td>
                  <td className="px-3 py-3 text-center font-mono"><NumCell v={w?.pvcnt} /></td>
                </tr>
                {/* Daily row */}
                <tr className="border-t border-gray-700/60 hover:bg-white/5 transition-colors">
                  <td className="px-3 py-3 text-gray-300 font-medium">Daily</td>
                  <td className="px-3 py-3 text-center font-mono"><SlopeCell v={d?.slope_d132 ?? null} /></td>
                  <td className="px-3 py-3 text-center font-mono"><SlopeCell v={d?.slope_d50 ?? null} /></td>
                  <td className="px-3 py-3 text-center font-mono"><SlopeCell v={d?.slope_d10 ?? null} /></td>
                  <td className="px-3 py-3 text-center font-mono"><NumCell v={d?.cross_d10_d50} /></td>
                  <td className="px-3 py-3 text-center font-mono"><NumCell v={d?.cross_d10_d132} /></td>
                  <td className="px-3 py-3 text-center font-mono"><NumCell v={d?.cross_d50_d132} /></td>
                  <td className="px-3 py-3 text-center font-mono"><NumCell v={d?.sar_count} /></td>
                  <td className="px-3 py-3 text-center font-mono"><NumCell v={d?.pvcnt} /></td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div
        className="flex-shrink-0 px-4 py-1.5 text-[10px] text-gray-600"
        style={{ borderTop: "1px solid #2a2d38" }}
      >
        + = above / long &nbsp;·&nbsp; − = below / short &nbsp;·&nbsp;
        🔴 positive = red &nbsp;·&nbsp; 🟢 negative = green (Chinese convention) &nbsp;·&nbsp;
        Slopes in % per bar
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

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex }}>
      <Rnd
        default={{
          x: 60 + initialOffset * 24,
          y: 120 + initialOffset * 24,
          width: 820,
          height: 210,
        }}
        minWidth={640}
        minHeight={160}
        bounds="parent"
        dragHandleClassName="analysis-drag-handle"
        className="pointer-events-auto"
        onMouseDown={(e) => { e.stopPropagation(); onFocus?.(); }}
      >
        {innerContent}
      </Rnd>
    </div>
  );
}
