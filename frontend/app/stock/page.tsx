"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StockSignal {
  symbol: string;
  score: number;
  signal_type?: string;
  close_price?: number;
  crossover_weekly?: string;
  crossover_daily?: string;
  pivot_detected?: string;
  explanation?: string;
}

interface StockReport {
  date: string | null;
  market: string;
  signals: StockSignal[];
}

export default function StockPage() {
  const [market, setMarket] = useState("TW");
  const [report, setReport] = useState<StockReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSignals = () => {
    setLoading(true);
    fetch(`/api/v1/stock/signals/latest?market=${market}`)
      .then((r) => r.json())
      .then((data) => { setReport(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchSignals(); }, [market]);

  const triggerRefresh = async () => {
    setRefreshing(true);
    await fetch(`/api/v1/stock/refresh?market=${market}`, { method: "POST" });
    setTimeout(() => { setRefreshing(false); fetchSignals(); }, 1000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return "text-green-600 font-bold";
    if (score >= 4) return "text-yellow-600 font-semibold";
    return "text-gray-600";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-300 hover:text-white text-sm">← Home</Link>
            <span className="text-white font-semibold text-lg">📈 Stock Engine (102.5 Theory)</span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="bg-blue-800 text-white border border-blue-600 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="TW">TW Market</option>
              <option value="US">US Market</option>
            </select>
            <button
              onClick={triggerRefresh}
              disabled={refreshing}
              className="bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
            >
              {refreshing ? "Queuing..." : "Refresh Data"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">102.5 Theory</h3>
          <p className="text-sm text-blue-700">
            Weekly: 2/10/26 MA crossover/under + pivot points. Daily: 2/10/50/132 MA crossover/under + pivot points.
            Signals are ranked by combined score and human review is required before any trading decisions.
          </p>
          <p className="text-xs text-blue-500 mt-2 font-medium">⚠️ Not financial advice. For research purposes only.</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading signals...</div>
        ) : report?.date ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">Latest Signals – {report.date} ({report.market})</h2>
              <span className="text-sm text-gray-500">{report.signals.length} signals</span>
            </div>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Symbol</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Signal</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Weekly XO</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Daily XO</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pivot</th>
                  </tr>
                </thead>
                <tbody>
                  {report.signals.map((s) => (
                    <tr key={s.symbol} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-bold text-sm text-gray-800">{s.symbol}</td>
                      <td className={`px-4 py-3 text-sm ${getScoreColor(s.score)}`}>{s.score.toFixed(1)}</td>
                      <td className="px-4 py-3">
                        {s.signal_type && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{s.signal_type}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.close_price?.toFixed(2) || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.crossover_weekly || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.crossover_daily || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.pivot_detected || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📊</div>
            <p className="mb-4">No stock signals yet.</p>
            <button
              onClick={triggerRefresh}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium"
            >
              Queue Data Refresh
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
