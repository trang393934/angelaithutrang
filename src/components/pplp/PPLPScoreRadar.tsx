import { useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { PPLPPillarScores } from "@/hooks/usePPLPScore";

interface PPLPScoreRadarProps {
  pillars: PPLPPillarScores;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  className?: string;
}

const PILLAR_LABELS = {
  pillar_s: { short: "S", full: "Service", vi: "Phục Vụ" },
  pillar_t: { short: "T", full: "Truth", vi: "Chân Thật" },
  pillar_h: { short: "H", full: "Healing", vi: "Chữa Lành" },
  pillar_c: { short: "C", full: "Contribution", vi: "Đóng Góp" },
  pillar_u: { short: "U", full: "Unity", vi: "Hợp Nhất" },
};

const PILLAR_COLORS = {
  pillar_s: "#10b981", // emerald
  pillar_t: "#3b82f6", // blue
  pillar_h: "#ec4899", // pink
  pillar_c: "#f59e0b", // amber
  pillar_u: "#8b5cf6", // violet
};

export const PPLPScoreRadar = ({ 
  pillars, 
  size = "md", 
  showLabels = true,
  className = ""
}: PPLPScoreRadarProps) => {
  const radarData = useMemo(() => [
    { 
      pillar: PILLAR_LABELS.pillar_s.short, 
      value: pillars.pillar_s, 
      fullMark: 100,
      fullName: PILLAR_LABELS.pillar_s.full,
      viName: PILLAR_LABELS.pillar_s.vi
    },
    { 
      pillar: PILLAR_LABELS.pillar_t.short, 
      value: pillars.pillar_t, 
      fullMark: 100,
      fullName: PILLAR_LABELS.pillar_t.full,
      viName: PILLAR_LABELS.pillar_t.vi
    },
    { 
      pillar: PILLAR_LABELS.pillar_h.short, 
      value: pillars.pillar_h, 
      fullMark: 100,
      fullName: PILLAR_LABELS.pillar_h.full,
      viName: PILLAR_LABELS.pillar_h.vi
    },
    { 
      pillar: PILLAR_LABELS.pillar_c.short, 
      value: pillars.pillar_c, 
      fullMark: 100,
      fullName: PILLAR_LABELS.pillar_c.full,
      viName: PILLAR_LABELS.pillar_c.vi
    },
    { 
      pillar: PILLAR_LABELS.pillar_u.short, 
      value: pillars.pillar_u, 
      fullMark: 100,
      fullName: PILLAR_LABELS.pillar_u.full,
      viName: PILLAR_LABELS.pillar_u.vi
    },
  ], [pillars]);

  const sizeConfig = {
    sm: { width: 150, height: 150, outerRadius: 50 },
    md: { width: 250, height: 250, outerRadius: 80 },
    lg: { width: 350, height: 350, outerRadius: 120 },
  };

  const config = sizeConfig[size];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullName: string; viName: string; value: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="font-semibold text-sm">{data.fullName}</p>
          <p className="text-xs text-muted-foreground">{data.viName}</p>
          <p className="text-lg font-bold text-primary">{data.value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <ResponsiveContainer width={config.width} height={config.height}>
        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={config.outerRadius}>
          <PolarGrid stroke="hsl(var(--border))" />
          {showLabels && (
            <PolarAngleAxis 
              dataKey="pillar" 
              tick={{ fill: "hsl(var(--foreground))", fontSize: size === "sm" ? 10 : 12 }}
            />
          )}
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            tickCount={5}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>

      {showLabels && size !== "sm" && (
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {Object.entries(PILLAR_LABELS).map(([key, label]) => (
            <div 
              key={key}
              className="flex items-center gap-1 text-xs"
              style={{ color: PILLAR_COLORS[key as keyof typeof PILLAR_COLORS] }}
            >
              <span className="font-bold">{label.short}</span>
              <span className="text-muted-foreground">= {label.vi}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
