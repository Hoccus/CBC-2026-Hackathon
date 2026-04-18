'use client'

import { useState } from 'react'
import { User, Activity, Target } from 'lucide-react'

interface FormData {
  age: number
  height_cm: number
  weight_kg: number
  gender: 'male' | 'female'
  activity_level: number
  goal: 'lose' | 'maintain' | 'gain'
}

export type MacroOnboardingFormData = FormData

interface OnboardingFormProps {
  onSubmit: (data: FormData) => void
}

export default function OnboardingForm({ onSubmit }: OnboardingFormProps) {
  const [formData, setFormData] = useState<FormData>({
    age: 30,
    height_cm: 170,
    weight_kg: 70,
    gender: 'male',
    activity_level: 1.375,
    goal: 'maintain'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const travelIntensityOptions = [
    { label: 'Low (Mostly Sedentary)', value: 1.2, description: 'Office work, minimal walking' },
    { label: 'Moderate (Active Travel)', value: 1.375, description: 'Regular walking, exploring cities' },
    { label: 'High (Very Active)', value: 1.55, description: 'Hiking, sports, constant movement' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Macro Tracker</h1>
          <p className="text-gray-600">Set up your nutrition profile for travel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info Section */}
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="text-blue-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age (years)
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="120"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={formData.height_cm}
                  onChange={(e) => setFormData({ ...formData, height_cm: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="50"
                  max="300"
                  step="0.1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="20"
                  max="500"
                  step="0.1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Travel Intensity Section */}
          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="text-green-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">Travel Intensity</h2>
            </div>

            <div className="space-y-3">
              {travelIntensityOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.activity_level === option.value
                      ? 'border-green-500 bg-green-100'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="activity_level"
                    value={option.value}
                    checked={formData.activity_level === option.value}
                    onChange={(e) => setFormData({ ...formData, activity_level: parseFloat(e.target.value) })}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-semibold text-gray-800">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Goal Section */}
          <div className="bg-purple-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="text-purple-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">Your Goal</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'lose', label: 'Lose Weight', emoji: '📉' },
                { value: 'maintain', label: 'Maintain', emoji: '⚖️' },
                { value: 'gain', label: 'Gain Weight', emoji: '📈' }
              ].map((goal) => (
                <label
                  key={goal.value}
                  className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.goal === goal.value
                      ? 'border-purple-500 bg-purple-100'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="goal"
                    value={goal.value}
                    checked={formData.goal === goal.value}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value as 'lose' | 'maintain' | 'gain' })}
                    className="sr-only"
                  />
                  <div className="text-3xl mb-2">{goal.emoji}</div>
                  <div className="font-semibold text-gray-800">{goal.label}</div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            Calculate My Macros
          </button>
        </form>
      </div>
    </div>
  )
}
