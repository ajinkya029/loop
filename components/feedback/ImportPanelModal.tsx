"use client";

import { useRef, useState } from "react";
import { X, Upload, Radio } from "lucide-react";
import { CHANNEL_LABELS } from "@/components/feedback/Badges";

const SIMULATABLE = ["SUPPORT_TICKET", "APP_STORE_REVIEW", "NPS_SURVEY", "SALES_CALL_NOTE", "SOCIAL_MENTION"];

export function ImportPanelModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvResult, setCsvResult] = useState<{ imported: number; failed: number; totalRows: number } | null>(
    null
  );
  const [simResult, setSimResult] = useState<{ channel: string; imported: number } | null>(null);
  const [loading, setLoading] = useState<"csv" | "sim" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCsvUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setError(null);
    setLoading("csv");

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/feedback/import", { method: "POST", body: formData });
    setLoading(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Import failed.");
      return;
    }
    const data = await res.json();
    setCsvResult(data);
    onImported();
  }

  async function handleSimulate(channel: string) {
    setError(null);
    setLoading("sim");
    const res = await fetch("/api/feedback/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, count: 8 }),
    });
    setLoading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Simulation failed.");
      return;
    }
    const data = await res.json();
    setSimResult(data);
    onImported();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Bulk ingest feedback</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Upload size={15} /> CSV bulk upload
          </h3>
          <p className="text-xs text-gray-500">
            Columns: <code className="bg-gray-100 px-1 rounded">content, channel, customer_label, created_at</code>
          </p>
          <input ref={fileRef} type="file" accept=".csv" className="input" />
          <button onClick={handleCsvUpload} disabled={loading === "csv"} className="btn-secondary w-full">
            {loading === "csv" ? "Importing…" : "Upload CSV"}
          </button>
          {csvResult && (
            <p className="text-xs text-gray-600">
              Imported {csvResult.imported} of {csvResult.totalRows} rows
              {csvResult.failed > 0 ? ` — ${csvResult.failed} failed` : ""}.
            </p>
          )}
        </div>

        <div className="space-y-3 border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Radio size={15} /> Simulate a channel
          </h3>
          <p className="text-xs text-gray-500">
            Pulls a realistic batch of feedback as if from a live integration.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SIMULATABLE.map((c) => (
              <button
                key={c}
                onClick={() => handleSimulate(c)}
                disabled={loading === "sim"}
                className="btn-secondary text-xs"
              >
                {CHANNEL_LABELS[c]}
              </button>
            ))}
          </div>
          {simResult && (
            <p className="text-xs text-gray-600">
              Pulled {simResult.imported} items from {CHANNEL_LABELS[simResult.channel]}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
