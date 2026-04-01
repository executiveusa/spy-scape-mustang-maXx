'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import dynamic from 'next/dynamic'

import Navbar from '@/components/ui/Navbar'
import HeroSection from '@/components/sections/HeroSection'
import BriefingSection from '@/components/sections/BriefingSection'
import ArsenalSection from '@/components/sections/ArsenalSection'
import MustangSection from '@/components/sections/MustangSection'
import CreatorSection from '@/components/sections/CreatorSection'
import MissionSection from '@/components/sections/MissionSection'
import EnterSection from '@/components/sections/EnterSection'

const LoadingScreen = dynamic(() => import('@/components/ui/LoadingScreen'), {
  ssr: false,
})

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

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
          {/* Scroll progress — thin cyan bar on top */}
          <motion.div
            className="fixed top-0 left-0 right-0 h-[2px] bg-maxx-cyan z-[100] origin-left"
            style={{ scaleX }}
          />

          <Navbar />
          <HeroSection />
          <BriefingSection />
          <ArsenalSection />
          <MustangSection />
          <CreatorSection />
          <MissionSection />
          <EnterSection />
        </>
      )}
    </main>
  )
}
