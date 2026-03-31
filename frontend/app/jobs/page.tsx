"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Job {
  id: number;
  name: string;
  job_type: string;
  status: string;
  retries: number;
  input_data?: Record<string, unknown>;
  error_message?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  running: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
  retrying: "bg-orange-100 text-orange-700",
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchJobs = () => {
    const url = filter === "all" ? "/api/v1/jobs/" : `/api/v1/jobs/?status=${filter}`;
    setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setJobs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, [filter]);

  const cancelJob = async (id: number) => {
    await fetch(`/api/v1/jobs/${id}/cancel`, { method: "PATCH" });
    fetchJobs();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-300 hover:text-white text-sm">← Home</Link>
            <span className="text-white font-semibold text-lg">⚙️ Job Monitor</span>
          </div>
          <button onClick={fetchJobs} className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-1.5 rounded-lg text-sm">
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6">
          {["all", "pending", "running", "done", "failed"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === s ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50 border"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">⚙️</div>
            <p>No jobs found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Retries</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">#{j.id}</td>
                    <td className="px-4 py-3 font-medium text-sm text-gray-800">{j.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{j.job_type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[j.status] || "bg-gray-100"}`}>
                        {j.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{j.retries}</td>
                    <td className="px-4 py-3">
                      {(j.status === "pending" || j.status === "running") && (
                        <button
                          onClick={() => cancelJob(j.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
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
