'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'

import Navbar from '@/components/ui/Navbar'
import HeroSection from '@/components/sections/HeroSection'
import BriefingSection from '@/components/sections/BriefingSection'
import ArsenalSection from '@/components/sections/ArsenalSection'
import MustangSection from '@/components/sections/MustangSection'
import MissionSection from '@/components/sections/MissionSection'
import EnterSection from '@/components/sections/EnterSection'

const LoadingScreen = dynamic(() => import('@/components/ui/LoadingScreen'), {
  ssr: false,
})

export default function HomePage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 2200)
    return () => clearTimeout(t)
  }, [])

  return (
    <main className="min-h-screen bg-maxx-black">
      <AnimatePresence>
        {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && (
        <>
          <Navbar />
          <HeroSection />
          <BriefingSection />
          <ArsenalSection />
          <MustangSection />
          <MissionSection />
          <EnterSection />
        </>
      )}
    </main>
  )
}
