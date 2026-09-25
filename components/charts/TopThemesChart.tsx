"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { EmptyState } from "@/components/charts/VolumeChart";

export function TopThemesChart({
  themes,
}: {
  themes: Array<{ name: string; count: number; color: string }>;
}) {
  if (themes.length === 0) return <EmptyState label="No themes yet — classify some feedback first." />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={themes} layout="vertical" margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {themes.map((t) => (
            <Cell key={t.name} fill={t.color || "#6153e8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
