"use client";

import { useState } from "react";
import useSWR from "swr";
import { TrendingUp, TrendingDown, Flame } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SentimentBadge, ChannelBadge } from "@/components/feedback/Badges";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const LINE_COLORS = ["#6153e8", "#22c55e", "#f59e0b", "#ef4444", "#0ea5e9"];

export default function TrendsPage() {
  const [days, setDays] = useState(30);
  const [openThemeId, setOpenThemeId] = useState<string | null>(null);

  const { data, isLoading } = useSWR(`/api/themes/trends?days=${days}`, fetcher);
  const { data: themeDetail } = useSWR(
    openThemeId ? `/api/themes/${openThemeId}` : null,
    fetcher
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trends</h1>
          <p className="text-sm text-gray-500 mt-1">
            Theme volume over time, with spikes flagged vs. the previous period.
          </p>
        </div>
        <select className="input w-[160px]" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Top theme volume</h2>
        {isLoading || !data ? (
          <div className="h-[280px] animate-pulse bg-gray-50 rounded-lg" />
        ) : data.timeSeries.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">
            Not enough data yet to chart trends.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.timeSeries} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              {data.topThemeIds.map((id: string, i: number) => {
                const theme = data.themes.find((t: any) => t.id === id);
                return (
                  <Line
                    key={id}
                    type="monotone"
                    dataKey={id}
                    name={theme?.name ?? id}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Theme</th>
              <th className="text-left px-4 py-3 font-medium">This period</th>
              <th className="text-left px-4 py-3 font-medium">Previous period</th>
              <th className="text-left px-4 py-3 font-medium">Change</th>
              <th className="text-left px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data?.themes?.map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setOpenThemeId(t.id)}>
                <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.name}
                  {t.isSpike && (
                    <span className="badge bg-orange-100 text-orange-700 text-[10px] flex items-center gap-1">
                      <Flame size={10} /> Spiking
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{t.current}</td>
                <td className="px-4 py-3 text-gray-500">{t.previous}</td>
                <td className="px-4 py-3">
                  <span
                    className={`flex items-center gap-1 text-xs font-medium ${
                      t.deltaPct > 0 ? "text-red-600" : t.deltaPct < 0 ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    {t.deltaPct > 0 ? <TrendingUp size={13} /> : t.deltaPct < 0 ? <TrendingDown size={13} /> : null}
                    {t.deltaPct > 0 ? "+" : ""}
                    {t.deltaPct}%
                  </span>
                </td>
                <td className="px-4 py-3 text-brand-600 text-xs">View feedback →</td>
              </tr>
            ))}
            {data?.themes?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  No themes yet — ingest and classify some feedback first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openThemeId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{themeDetail?.theme?.name ?? "Loading…"}</h2>
              <button onClick={() => setOpenThemeId(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {themeDetail?.feedback?.map((f: any) => (
                <div key={f.id} className="border border-gray-100 rounded-lg p-3">
                  <p className="text-sm text-gray-800">{f.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <ChannelBadge channel={f.channel} />
                    <SentimentBadge sentiment={f.sentiment} />
                  </div>
                </div>
              ))}
              {themeDetail && themeDetail.feedback.length === 0 && (
                <p className="text-sm text-gray-400">No feedback items linked to this theme.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
