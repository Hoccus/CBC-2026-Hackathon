'use client'

interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  color?: string
  label: string
  current: number
  target: number
  unit: string
}

export default function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 10,
  color = '#3b82f6',
  label,
  current,
  target,
  unit
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
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
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold" style={{ color }}>
            {Math.round(percentage)}%
          </div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="font-semibold text-gray-800">{label}</div>
        <div className="text-sm text-gray-600">
          {current.toFixed(0)} / {target.toFixed(0)} {unit}
        </div>
      </div>
    </div>
  )
}
