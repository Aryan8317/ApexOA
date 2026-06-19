"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

interface SkillMatrixProps {
  averageRating: number;
}

export default function SkillMatrix({ averageRating }: SkillMatrixProps) {
  // Scale the chart based on the user's actual average rating (which is 1-10)
  // If no sessions, default to placeholder baseline
  const base = averageRating > 0 ? averageRating * 10 : 75;

  const data = [
    { subject: "Data Structures", A: Math.min(100, Math.max(30, base - 5)), fullMark: 100 },
    { subject: "System Design", A: Math.min(100, Math.max(30, base - 12)), fullMark: 100 },
    { subject: "Communication", A: Math.min(100, Math.max(30, base + 8)), fullMark: 100 },
    { subject: "Problem Solving", A: Math.min(100, Math.max(30, base + 2)), fullMark: 100 },
    { subject: "Code Quality", A: Math.min(100, Math.max(30, base - 3)), fullMark: 100 },
  ];

  return (
    <div className="w-full h-[260px] relative flex items-center justify-center">
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
          <Radar 
            name="Skills" 
            dataKey="A" 
            stroke="#9d4300" // primary orange
            fill="#ffdbca" // primary fixed (warm orange light fill)
            fillOpacity={0.5} 
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
