'use client'

import { useState, useEffect, useRef } from 'react'
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
import KineticMarquee from '@/components/ui/KineticMarquee'

const LoadingScreen = dynamic(() => import('@/components/ui/LoadingScreen'))
const EngineSound = dynamic(() => import('@/components/ui/EngineSound'), {
  ssr: false,
})

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

  // Color shift — update --page-bg CSS var as sections enter viewport
  useEffect(() => {
    if (loading) return
    const sections = [
      { id: 'hero',     bg: '#05070a' },
      { id: 'briefing', bg: '#04090b' },
      { id: 'arsenal',  bg: '#05070a' },
      { id: 'mustang',  bg: '#0a0704' },
      { id: 'creator',  bg: '#040b0a' },
      { id: 'mission',  bg: '#06050b' },
      { id: 'enter',    bg: '#08060a' },
    ]
    const observers: IntersectionObserver[] = []
    sections.forEach(({ id, bg }) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            document.documentElement.style.setProperty('--page-bg', bg)
            document.body.style.backgroundColor = bg
          }
        },
        { threshold: 0.25 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [loading])

  return (
    <main className="min-h-screen bg-maxx-black">
      <AnimatePresence>
        {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {/* Scroll progress — thin cyan bar on top */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-maxx-cyan z-[100] origin-left"
        style={{ scaleX }}
      />

      <EngineSound />
      <Navbar />
      <HeroSection />
      <KineticMarquee text="AGENT 006 • MACS DIGITAL MEDIA • YAPPYVERSE • CLASSIFIED • EYES ONLY •" />
      <BriefingSection />
      <KineticMarquee text="THE BRIEFING • Q SPEAKS • MISSION PARAMETERS • CLEARANCE LEVEL 6 •" />
      <ArsenalSection />
      <KineticMarquee text="Q WORKSHOP • CUSTOM TECH • CLASSIFIED HARDWARE • ACTIVE DEPLOYMENT •" />
      <MustangSection />
      <KineticMarquee text="THE MUSTANG MAXX • ELEANOR 2056 • QUANTUM V12 • 2056 HP • 1.4s 0-60 •" />
      <CreatorSection />
      <KineticMarquee text="MACS DIGITAL MEDIA • STACY MACS • CREATOR • YAPPYVERSE ARCHITECT •" />
      <MissionSection />
      <KineticMarquee text="NIGHT RUN • CHAPTER SEVEN • OPERATION ELEANOR • MISSION COMPLETE •" />
      <EnterSection />
    </main>
  )
}
