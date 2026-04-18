'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingForm from '@/components/OnboardingForm'

interface FormData {
  age: number
  height_cm: number
  weight_kg: number
  gender: 'male' | 'female'
  activity_level: number
  goal: 'lose' | 'maintain' | 'gain'
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFormSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/api/profile/calculate-macros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to calculate macros')
      }

      const data = await response.json()
      
      // Store the macro data in localStorage for the dashboard
      localStorage.setItem('macroData', JSON.stringify(data.current_macros))
      
      // Navigate to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('Failed to connect to the backend. Make sure the API is running on http://localhost:8000')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Calculating your macros...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Connection Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => setError(null)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <OnboardingForm onSubmit={handleFormSubmit} />
}
