"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { DOMAINS, DOMAIN_LABELS } from "@/lib/domainStats";
import type { Domain, DomainStat } from "@/lib/domainStats";

interface SkillMatrixProps {
  stats: Record<Domain, DomainStat>;
}

// Custom tooltip so users see "mean / 10" and "based on N answers"
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { subject, mean, count } = payload[0].payload;
  return (
    <div className="bg-surface-white border border-outline-variant/40 rounded-lg px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-on-surface">{subject}</p>
      {mean !== null ? (
        <>
          <p className="text-primary">{mean.toFixed(1)} / 10</p>
          <p className="text-on-surface-variant text-xs">based on {count} answer{count !== 1 ? "s" : ""}</p>
        </>
      ) : (
        <p className="text-on-surface-variant text-xs">No data yet</p>
      )}
    </div>
  );
}

export default function SkillMatrix({ stats }: SkillMatrixProps) {
  const data = DOMAINS.map((d) => ({
    subject: DOMAIN_LABELS[d],
    // Scale 1–10 to 0–100 for the chart. Null → 0 (shown as "no data" point)
    A: stats[d].mean !== null ? (stats[d].mean! / 10) * 100 : 0,
    mean: stats[d].mean,
    count: stats[d].count,
    hasData: stats[d].mean !== null,
  }));

  const hasAnyData = data.some((d) => d.hasData);

  return (
    <div className="w-full h-[260px] relative flex items-center justify-center">
      {!hasAnyData && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <span className="text-xs text-on-surface-variant bg-surface-cream/80 px-3 py-1 rounded-full border border-outline-variant/30">
            Complete interviews to see your skill map
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#e1dfdc" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#584237", fontSize: 11, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "#636360", fontSize: 9 }}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Skills"
            dataKey="A"
            stroke="#9d4300"
            fill="#ffdbca"
            fillOpacity={hasAnyData ? 0.5 : 0.1}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
