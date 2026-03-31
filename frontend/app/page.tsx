"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardStats {
  topics: number;
  scripts: number;
  jobs: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats>({ topics: 0, scripts: 0, jobs: 0 });
  const [backendStatus, setBackendStatus] = useState<"checking" | "ok" | "error">("checking");

  useEffect(() => {
    fetch("/api/v1/topics/", { redirect: "follow" })
      .then((r) => r.json())
      .then((data) => {
        setStats((s) => ({ ...s, topics: Array.isArray(data) ? data.length : 0 }));
        setBackendStatus("ok");
      })
      .catch(() => setBackendStatus("error"));

    fetch("/api/v1/scripts/", { redirect: "follow" })
      .then((r) => r.json())
      .then((data) => setStats((s) => ({ ...s, scripts: Array.isArray(data) ? data.length : 0 })))
      .catch(() => {});

    fetch("/api/v1/jobs/", { redirect: "follow" })
      .then((r) => r.json())
      .then((data) => setStats((s) => ({ ...s, jobs: Array.isArray(data) ? data.length : 0 })))
      .catch(() => {});
  }, []);

  const navItems = [
    { href: "/topics", label: "Topic Inbox", icon: "💡", desc: "Manage content ideas and topics" },
    { href: "/scripts", label: "Script Studio", icon: "📝", desc: "Create and edit video scripts" },
    { href: "/stock", label: "Stock Engine", icon: "📈", desc: "Daily stock signals (102.5 theory)" },
    { href: "/jobs", label: "Job Monitor", icon: "⚙️", desc: "Track background jobs and tasks" },
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">🦅 OpenClaw</h1>
              <p className="text-blue-200 text-sm mt-1">AI-Driven Content Production & Research Automation</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-200">Backend:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  backendStatus === "ok"
                    ? "bg-green-500 text-white"
                    : backendStatus === "error"
                    ? "bg-red-500 text-white"
                    : "bg-yellow-500 text-white"
                }`}
              >
                {backendStatus === "checking" ? "Connecting..." : backendStatus === "ok" ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-blue-600">{stats.topics}</div>
            <div className="text-gray-500 text-sm mt-1">Topics in Inbox</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
            <div className="text-3xl font-bold text-green-600">{stats.scripts}</div>
            <div className="text-gray-500 text-sm mt-1">Scripts Created</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
            <div className="text-3xl font-bold text-purple-600">{stats.jobs}</div>
            <div className="text-gray-500 text-sm mt-1">Jobs Tracked</div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-700 mb-4">System Modules</h2>
        <div className="grid grid-cols-2 gap-6 mb-10">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-xl shadow hover:shadow-md transition-shadow p-6 flex items-start gap-4 group border border-gray-100 hover:border-blue-200"
            >
              <span className="text-3xl">{item.icon}</span>
              <div>
                <div className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                  {item.label}
                </div>
                <div className="text-sm text-gray-500 mt-1">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-3">Content Pipeline Overview</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {["💡 Idea", "→", "📋 Topic", "→", "📝 Script", "→", "🎬 Video", "→", "📤 Publish"].map(
              (step, i) => (
                <span
                  key={i}
                  className={
                    step === "→"
                      ? "text-gray-400"
                      : "bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                  }
                >
                  {step}
                </span>
              )
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            OpenClaw automates the entire content production pipeline from idea research to multi-platform publishing.
          </p>
        </div>
      </main>
    </div>
  );
}
