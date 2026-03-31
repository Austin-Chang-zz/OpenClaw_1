"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Script {
  id: number;
  title: string;
  content: string;
  language: string;
  tone: string;
  duration_seconds: number;
  status: string;
  hook?: string;
  cta?: string;
}

const TONES = ["storytelling", "scientific", "spiritual", "elderly-friendly", "viral-hook", "serious"];

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Script | null>(null);
  const [form, setForm] = useState({
    title: "", content: "", hook: "", cta: "",
    language: "zh-TW", tone: "storytelling", duration_seconds: 60,
  });
  const [loading, setLoading] = useState(true);

  const fetchScripts = () => {
    setLoading(true);
    fetch("/api/v1/scripts/")
      .then((r) => r.json())
      .then((data) => { setScripts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchScripts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/v1/scripts/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, duration_seconds: Number(form.duration_seconds) }),
    });
    setForm({ title: "", content: "", hook: "", cta: "", language: "zh-TW", tone: "storytelling", duration_seconds: 60 });
    setShowForm(false);
    fetchScripts();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-300 hover:text-white text-sm">← Home</Link>
            <span className="text-white font-semibold text-lg">📝 Script Studio</span>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setSelected(null); }}
            className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + New Script
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 flex gap-6">
        <div className="w-80 flex-shrink-0">
          {showForm && (
            <div className="bg-white rounded-xl shadow p-5 mb-4 border border-blue-200">
              <h3 className="font-semibold text-gray-700 mb-4 text-sm">New Script</h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Title *"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                >
                  <option value="zh-TW">繁體中文</option>
                  <option value="zh-CN">简体中文</option>
                  <option value="en">English</option>
                </select>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={form.tone}
                  onChange={(e) => setForm({ ...form, tone: e.target.value })}
                >
                  {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={form.duration_seconds}
                  onChange={(e) => setForm({ ...form, duration_seconds: Number(e.target.value) })}
                >
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                  <option value={90}>90 seconds</option>
                </select>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows={5}
                  placeholder="Script content *"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                />
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Hook (optional)"
                  value={form.hook}
                  onChange={(e) => setForm({ ...form, hook: e.target.value })}
                />
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="CTA (optional)"
                  value={form.cta}
                  onChange={(e) => setForm({ ...form, cta: e.target.value })}
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Save</button>
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
          ) : (
            <div className="space-y-2">
              {scripts.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:border-blue-300 border transition-colors ${selected?.id === s.id ? "border-blue-500" : "border-transparent"}`}
                >
                  <div className="font-medium text-sm text-gray-800 truncate">{s.title}</div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s.language}</span>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{s.duration_seconds}s</span>
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">{s.status}</span>
                  </div>
                </div>
              ))}
              {scripts.length === 0 && !showForm && (
                <div className="text-center py-10 text-gray-400 text-sm">No scripts yet</div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 bg-white rounded-xl shadow p-6">
          {selected ? (
            <>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-800">{selected.title}</h2>
                <div className="flex gap-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{selected.language}</span>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">{selected.tone}</span>
                  <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded">{selected.duration_seconds}s</span>
                </div>
              </div>
              {selected.hook && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-xs font-semibold text-yellow-700 uppercase mb-1">Hook</div>
                  <p className="text-sm text-gray-700">{selected.hook}</p>
                </div>
              )}
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[200px]">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Script Content</div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{selected.content}</p>
              </div>
              {selected.cta && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs font-semibold text-blue-700 uppercase mb-1">Call to Action</div>
                  <p className="text-sm text-gray-700">{selected.cta}</p>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-5xl mb-4">📝</div>
                <p>Select a script to view it, or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
