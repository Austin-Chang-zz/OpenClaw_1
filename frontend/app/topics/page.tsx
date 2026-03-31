"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Topic {
  id: number;
  title: string;
  category: string;
  status: string;
  score: number;
  language: string;
  angle?: string;
}

const CATEGORIES = [
  { value: "ping_shuai_gong", label: "平甩功" },
  { value: "senior_wellness", label: "老人養生" },
  { value: "life_philosophy", label: "人生哲理" },
  { value: "extraordinary", label: "特異功能" },
  { value: "past_lives", label: "前世今生" },
  { value: "hot_topics", label: "Hot Topics" },
  { value: "coding", label: "Coding" },
  { value: "stock", label: "Stock" },
];

const STATUS_COLORS: Record<string, string> = {
  idea: "bg-gray-100 text-gray-700",
  scoring: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  in_production: "bg-blue-100 text-blue-700",
  done: "bg-purple-100 text-purple-700",
  rejected: "bg-red-100 text-red-700",
};

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "hot_topics", language: "zh-TW", angle: "" });
  const [loading, setLoading] = useState(true);

  const fetchTopics = () => {
    setLoading(true);
    fetch("/api/v1/topics/")
      .then((r) => r.json())
      .then((data) => { setTopics(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchTopics(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/v1/topics/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", category: "hot_topics", language: "zh-TW", angle: "" });
    setShowForm(false);
    fetchTopics();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-300 hover:text-white text-sm">← Home</Link>
            <span className="text-white font-semibold text-lg">💡 Topic Inbox</span>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + New Topic
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {showForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6 border border-blue-200">
            <h3 className="font-semibold text-gray-700 mb-4">Add New Topic</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Title *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="Topic title..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Category</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Language</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                >
                  <option value="zh-TW">Traditional Chinese (繁體中文)</option>
                  <option value="zh-CN">Simplified Chinese (简体中文)</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Angle / Notes</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  value={form.angle}
                  onChange={(e) => setForm({ ...form, angle: e.target.value })}
                  placeholder="Content angle or notes..."
                />
              </div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium">
                  Save Topic
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading topics...</div>
        ) : topics.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">💡</div>
            <p>No topics yet. Add your first content idea!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Language</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-sm text-gray-800">{t.title}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                        {CATEGORIES.find((c) => c.value === t.category)?.label || t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{t.language}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[t.status] || "bg-gray-100 text-gray-700"}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.score.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
