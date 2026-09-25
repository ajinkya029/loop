"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { FileText, Plus, Printer } from "lucide-react";
import { subDays, formatISO } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ReportsPage() {
  const { data: session } = useSession();
  const canGenerate = session?.user?.role === "ADMIN" || session?.user?.role === "ANALYST";

  const { data: reports, mutate } = useSWR("/api/reports", fetcher);
  const [openReportId, setOpenReportId] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Voice-of-Customer digests, ready to forward to leadership.
          </p>
        </div>
        {canGenerate && (
          <button onClick={() => setShowGenerate(true)} className="btn-primary">
            <Plus size={16} /> Generate report
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports?.map((r: any) => (
          <button
            key={r.id}
            onClick={() => setOpenReportId(r.id)}
            className="card p-5 text-left hover:shadow-md transition-shadow"
          >
            <FileText size={18} className="text-brand-500 mb-2" />
            <p className="font-semibold text-gray-800 text-sm">{r.title}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(r.periodStart).toLocaleDateString()} – {new Date(r.periodEnd).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-400 mt-2">by {r.generatedByName}</p>
          </button>
        ))}
        {reports?.length === 0 && (
          <div className="card p-8 text-center text-gray-400 col-span-full text-sm">
            No reports yet. Generate your first Voice-of-Customer report above.
          </div>
        )}
      </div>

      {showGenerate && (
        <GenerateReportModal
          onClose={() => setShowGenerate(false)}
          onGenerated={(id) => {
            mutate();
            setOpenReportId(id);
          }}
        />
      )}
      {openReportId && <ReportDetailModal id={openReportId} onClose={() => setOpenReportId(null)} />}
    </div>
  );
}

function GenerateReportModal({
  onClose,
  onGenerated,
}: {
  onClose: () => void;
  onGenerated: (id: string) => void;
}) {
  const [periodStart, setPeriodStart] = useState(formatISO(subDays(new Date(), 7), { representation: "date" }));
  const [periodEnd, setPeriodEnd] = useState(formatISO(new Date(), { representation: "date" }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodStart, periodEnd }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Report generation failed.");
      return;
    }
    const data = await res.json();
    onGenerated(data.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Generate Voice-of-Customer report</h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Period start</label>
              <input
                type="date"
                className="input"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Period end</label>
              <input
                type="date"
                className="input"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Generating…" : "Generate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReportDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data } = useSWR(`/api/reports/${id}`, fetcher);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 print:bg-white print:static">
      <div className="card w-full max-w-2xl max-h-[85vh] overflow-y-auto p-8 print:shadow-none print:max-h-none">
        {!data ? (
          <p className="text-gray-400 text-sm">Loading report…</p>
        ) : (
          <div className="space-y-6" id="report-content">
            <div className="flex items-start justify-between print:hidden">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{data.title}</h2>
                <p className="text-sm text-gray-500">{data.stats.periodLabel}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="btn-secondary text-xs">
                  <Printer size={14} /> Export PDF
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
                  ✕
                </button>
              </div>
            </div>

            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Executive summary</h3>
              <p className="text-gray-800 text-sm leading-relaxed">{data.narrative.summary}</p>
            </section>

            <div className="grid grid-cols-3 gap-3">
              <Stat label="Total items" value={data.stats.totalItems} />
              <Stat label="Positive" value={data.stats.sentimentBreakdown.positive} />
              <Stat label="Negative" value={data.stats.sentimentBreakdown.negative} />
            </div>

            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Top themes</h3>
              <ul className="space-y-1">
                {data.stats.topThemes.map((t: any) => (
                  <li key={t.name} className="flex justify-between text-sm border-b border-gray-100 py-1.5">
                    <span className="text-gray-700">{t.name}</span>
                    <span className="text-gray-400">{t.count} items</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-700 mt-3 leading-relaxed">{data.narrative.themeHighlights}</p>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notable verbatim quotes</h3>
              <div className="space-y-2">
                {data.stats.representativeQuotes.map((q: any, i: number) => (
                  <blockquote key={i} className="border-l-2 border-brand-300 pl-3 text-sm text-gray-600 italic">
                    "{q.content}"
                  </blockquote>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Recommended actions</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
                {data.narrative.recommendedActions.map((a: string, i: number) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
