"use client";

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label: string;
  current: number;
  target: number;
  unit: string;
}

export default function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 10,
  color = "#3b82f6",
  label,
  current,
  target,
  unit,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="flex-col" style={{ alignItems: "center", gap: 0 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 700, color }}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
        <div className="text-muted" style={{ fontSize: 12 }}>
          {current.toFixed(0)} / {target.toFixed(0)} {unit}
        </div>
      </div>
    </div>
  );
}
