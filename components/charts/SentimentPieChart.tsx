"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { EmptyState } from "@/components/charts/VolumeChart";

const COLORS: Record<string, string> = {
  Positive: "#22c55e",
  Neutral: "#9ca3af",
  Negative: "#ef4444",
  Unclassified: "#d1d5db",
};

export function SentimentPieChart({
  breakdown,
}: {
  breakdown: { POSITIVE: number; NEUTRAL: number; NEGATIVE: number; UNCLASSIFIED: number };
}) {
  const data = [
    { name: "Positive", value: breakdown.POSITIVE },
    { name: "Neutral", value: breakdown.NEUTRAL },
    { name: "Negative", value: breakdown.NEGATIVE },
    { name: "Unclassified", value: breakdown.UNCLASSIFIED },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return <EmptyState label="No classified feedback yet." />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
