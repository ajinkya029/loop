"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Plus, Upload, Search, RefreshCcw } from "lucide-react";
import { SentimentBadge, StatusBadge, ChannelBadge, CHANNEL_LABELS } from "@/components/feedback/Badges";
import { FeedbackFormModal } from "@/components/feedback/FeedbackFormModal";
import { ImportPanelModal } from "@/components/feedback/ImportPanelModal";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function InboxPage() {
  const { data: session } = useSession();
  const canWrite = session?.user?.role === "ADMIN" || session?.user?.role === "ANALYST";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const params = new URLSearchParams({
    page: String(page),
    pageSize: "15",
    ...(search && { search }),
    ...(channel && { channel }),
    ...(sentiment && { sentiment }),
    ...(status && { status }),
  });

  const { data, isLoading, mutate } = useSWR(`/api/feedback?${params.toString()}`, fetcher);

  async function updateStatus(id: string, newStatus: string) {
    await fetch(`/api/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    mutate();
  }

  function resetToFirstPage() {
    setPage(1);
    mutate();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="text-sm text-gray-500 mt-1">Search, filter, and triage incoming feedback.</p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <button onClick={() => setShowImport(true)} className="btn-secondary">
              <Upload size={16} /> Bulk ingest
            </button>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus size={16} /> Add feedback
            </button>
          </div>
        )}
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="label">Search</label>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-8"
              placeholder="Search feedback content…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <FilterSelect
          label="Channel"
          value={channel}
          onChange={(v) => {
            setChannel(v);
            setPage(1);
          }}
          options={Object.entries(CHANNEL_LABELS)}
        />
        <FilterSelect
          label="Sentiment"
          value={sentiment}
          onChange={(v) => {
            setSentiment(v);
            setPage(1);
          }}
          options={[
            ["POSITIVE", "Positive"],
            ["NEUTRAL", "Neutral"],
            ["NEGATIVE", "Negative"],
          ]}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={[
            ["NEW", "New"],
            ["REVIEWED", "Reviewed"],
            ["ACTIONED", "Actioned"],
          ]}
        />
        <button onClick={resetToFirstPage} className="btn-secondary" title="Refresh">
          <RefreshCcw size={15} />
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Feedback</th>
                <th className="text-left px-4 py-3 font-medium">Channel</th>
                <th className="text-left px-4 py-3 font-medium">Sentiment</th>
                <th className="text-left px-4 py-3 font-medium">Themes</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && data?.items?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    No feedback matches these filters yet.
                  </td>
                </tr>
              )}
              {data?.items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 max-w-[380px]">
                    <p className="text-gray-800 line-clamp-2">{item.content}</p>
                    {item.customerLabel && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.customerLabel}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ChannelBadge channel={item.channel} />
                  </td>
                  <td className="px-4 py-3">
                    <SentimentBadge sentiment={item.sentiment} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {item.themes?.map((ft: any) => (
                        <span key={ft.themeId} className="badge bg-gray-100 text-gray-600 text-[10px]">
                          {ft.theme.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {canWrite ? (
                      <select
                        value={item.status}
                        onChange={(e) => updateStatus(item.id, e.target.value)}
                        className="text-xs rounded-md border border-gray-200 px-2 py-1"
                      >
                        <option value="NEW">New</option>
                        <option value="REVIEWED">Reviewed</option>
                        <option value="ACTIONED">Actioned</option>
                      </select>
                    ) : (
                      <StatusBadge status={item.status} />
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data?.pagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>
              Page {data.pagination.page} of {Math.max(data.pagination.totalPages, 1)} ·{" "}
              {data.pagination.total} items
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary py-1 px-3 text-xs"
              >
                Previous
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary py-1 px-3 text-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <FeedbackFormModal onClose={() => setShowForm(false)} onCreated={() => mutate()} />
      )}
      {showImport && (
        <ImportPanelModal onClose={() => setShowImport(false)} onImported={() => mutate()} />
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="w-[160px]">
      <label className="label">{label}</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
