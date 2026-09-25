"use client";

import useSWR from "swr";
import { StatCard } from "@/components/ui/StatCard";
import { VolumeChart } from "@/components/charts/VolumeChart";
import { SentimentPieChart } from "@/components/charts/SentimentPieChart";
import { TopThemesChart } from "@/components/charts/TopThemesChart";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { data, isLoading, error } = useSWR("/api/dashboard/stats", fetcher, {
    refreshInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">The shape of your feedback, at a glance.</p>
      </div>

      {error && (
        <div className="card p-4 text-sm text-red-600">Couldn't load dashboard stats. Try refreshing.</div>
      )}

      {isLoading || !data ? (
        <SkeletonDashboard />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total feedback items" value={data.statCards.totalItems} />
            <StatCard label="% negative" value={`${data.statCards.pctNegative}%`} />
            <StatCard label="New this week" value={data.statCards.newThisWeek} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Volume over time (30 days)</h2>
              <VolumeChart data={data.volumeOverTime} />
            </div>
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Sentiment breakdown</h2>
              <SentimentPieChart breakdown={data.sentimentBreakdown} />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Top themes</h2>
            <TopThemesChart themes={data.topThemes} />
          </div>
        </>
      )}
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-5 h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card h-72" />
        <div className="card h-72" />
      </div>
      <div className="card h-72" />
    </div>
  );
}
