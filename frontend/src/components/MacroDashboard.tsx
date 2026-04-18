'use client'

import CircularProgress from './CircularProgress'
import { Apple, ChevronLeft } from 'lucide-react'

interface MacroData {
  consumed: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
  }
  target: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
  }
  remaining: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
  }
}

interface MacroDashboardProps {
  macroData: MacroData
  onBack: () => void
}

export default function MacroDashboard({ macroData, onBack }: MacroDashboardProps) {
  const { consumed, target, remaining } = macroData

  const calculatePercentage = (consumed: number, target: number) => {
    return target > 0 ? (consumed / target) * 100 : 0
  }

  const macros = [
    {
      label: 'Calories',
      current: consumed.calories,
      target: target.calories,
      unit: 'kcal',
      color: '#f59e0b',
      percentage: calculatePercentage(consumed.calories, target.calories)
    },
    {
      label: 'Protein',
      current: consumed.protein_g,
      target: target.protein_g,
      unit: 'g',
      color: '#ef4444',
      percentage: calculatePercentage(consumed.protein_g, target.protein_g)
    },
    {
      label: 'Carbs',
      current: consumed.carbs_g,
      target: target.carbs_g,
      unit: 'g',
      color: '#3b82f6',
      percentage: calculatePercentage(consumed.carbs_g, target.carbs_g)
    },
    {
      label: 'Fat',
      current: consumed.fat_g,
      target: target.fat_g,
      unit: 'g',
      color: '#8b5cf6',
      percentage: calculatePercentage(consumed.fat_g, target.fat_g)
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ChevronLeft size={20} />
            <span>Back to Profile</span>
          </button>
          <div className="flex items-center gap-3">
            <Apple className="text-green-600" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Today&apos;s Macros</h1>
              <p className="text-gray-600">Track your nutrition on the go</p>
            </div>
          </div>
        </div>

        {/* Circular Progress Bars */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Daily Progress</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {macros.map((macro) => (
              <CircularProgress
                key={macro.label}
                percentage={macro.percentage}
                color={macro.color}
                label={macro.label}
                current={macro.current}
                target={macro.target}
                unit={macro.unit}
              />
            ))}
          </div>
        </div>

        {/* Remaining Today Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Remaining Today</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
              <div className="text-sm font-medium text-orange-800 mb-2">Calories</div>
              <div className="text-3xl font-bold text-orange-600">
                {remaining.calories > 0 ? remaining.calories.toFixed(0) : 0}
              </div>
              <div className="text-sm text-orange-700 mt-1">kcal left</div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6">
              <div className="text-sm font-medium text-red-800 mb-2">Protein</div>
              <div className="text-3xl font-bold text-red-600">
                {remaining.protein_g > 0 ? remaining.protein_g.toFixed(0) : 0}
              </div>
              <div className="text-sm text-red-700 mt-1">g left</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
              <div className="text-sm font-medium text-blue-800 mb-2">Carbs</div>
              <div className="text-3xl font-bold text-blue-600">
                {remaining.carbs_g > 0 ? remaining.carbs_g.toFixed(0) : 0}
              </div>
              <div className="text-sm text-blue-700 mt-1">g left</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
              <div className="text-sm font-medium text-purple-800 mb-2">Fat</div>
              <div className="text-3xl font-bold text-purple-600">
                {remaining.fat_g > 0 ? remaining.fat_g.toFixed(0) : 0}
              </div>
              <div className="text-sm text-purple-700 mt-1">g left</div>
            </div>
          </div>

          {/* LLM-Ready Summary */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">📊 AI Coach Summary</div>
            <div className="text-xs text-gray-600 font-mono bg-white p-3 rounded border border-gray-200 overflow-x-auto">
              {JSON.stringify({ consumed, target, remaining }, null, 2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
