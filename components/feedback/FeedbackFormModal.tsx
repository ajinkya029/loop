"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { CHANNEL_LABELS } from "@/components/feedback/Badges";

const CHANNELS = Object.keys(CHANNEL_LABELS).filter((c) => c !== "CSV_IMPORT");

export function FeedbackFormModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState("MANUAL");
  const [customerLabel, setCustomerLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, channel, customerLabel: customerLabel || undefined }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save feedback.");
      return;
    }
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add feedback</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="label">Feedback content</label>
            <textarea
              required
              className="input min-h-[110px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What did the customer say?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Channel</label>
              <select className="input" value={channel} onChange={(e) => setChannel(e.target.value)}>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {CHANNEL_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Customer / company (optional)</label>
              <input
                className="input"
                value={customerLabel}
                onChange={(e) => setCustomerLabel(e.target.value)}
                placeholder="Acme Inc."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Saving & classifying…" : "Save feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
