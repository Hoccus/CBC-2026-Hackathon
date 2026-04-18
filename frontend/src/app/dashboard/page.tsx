'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MacroDashboard from '@/components/MacroDashboard'

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

export default function DashboardPage() {
  const router = useRouter()
  const [macroData, setMacroData] = useState<MacroData | null>(null)

  useEffect(() => {
    // Load macro data from localStorage
    const storedData = localStorage.getItem('macroData')
    if (storedData) {
      setMacroData(JSON.parse(storedData))
    } else {
      // If no data, redirect to profile page
      router.push('/profile')
    }
  }, [router])

  const handleBack = () => {
    router.push('/profile')
  }

  if (!macroData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  return <MacroDashboard macroData={macroData} onBack={handleBack} />
}
