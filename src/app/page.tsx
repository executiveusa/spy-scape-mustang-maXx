'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import dynamic from 'next/dynamic'
import Navbar from '@/components/ui/Navbar'
import { Shield, ChevronDown, Play, Volume2, VolumeX } from 'lucide-react'

// Loading screen (dynamically imported to avoid SSR issues)
const LoadingScreen = dynamic(() => import('@/components/ui/LoadingScreen'), {
  ssr: false,
})

// Hero Section with SpyScape-style scroll effects
function HeroSection() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 1000], [0, 300])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  const scale = useTransform(scrollY, [0, 500], [1, 0.9])

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"
        style={{ y }}
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_1px,#00F0FF_1px)] bg-[size:60px_60px] opacity-5" />
        
        {/* Spotlight effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-radial from-cyan-400/10 via-transparent to-black"
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-4"
        style={{ opacity, scale }}
      >
        {/* Glitch title effect */}
        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-[0.1em] mb-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="relative inline-block">
            <span className="relative z-10">MUSTANG</span>
            <motion.span
              className="absolute inset-0 text-cyan-400 z-20 opacity-0"
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 3 }}
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 30%, 0 30%)' }}
            >
              MUSTANG
            </motion.span>
          </span>
          <br />
          <span className="text-cyan-400 relative inline-block">
            MAXX
            <motion.span
              className="absolute -inset-1 text-cyan-400 z-10 opacity-50 blur-sm"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              MAXX
            </motion.span>
          </span>
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl text-gray-400 font-mono mt-6 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          AGENT 006 • YAPPYVERSE
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.button
            className="group flex items-center gap-3 px-8 py-4 bg-cyan-400 text-black font-bold rounded-full hover:bg-cyan-300 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="w-5 h-5 fill-current" />
            BEGIN MISSION
          </motion.button>
          <motion.button
            className="group flex items-center gap-3 px-8 py-4 bg-transparent border border-cyan-400 text-cyan-400 font-bold rounded-full hover:bg-cyan-400/10 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Shield className="w-5 h-5" />
            VIEW TRAINING
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="w-8 h-8 text-cyan-400 opacity-50" />
      </motion.div>
    </section>
  )
}

// Mission Section
function MissionSection() {
  return (
    <section id="mission" className="relative py-32 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="text-cyan-400">//</span> MISSION BRIEFING
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Infiltrate the shadows. Execute with precision. Become legend.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'INFILTRATION', icon: '🎭', desc: 'Master the art of covert entry' },
            { title: 'EXTRACTION', icon: '💼', desc: 'Secure assets with zero trace' },
            { title: 'ELIMINATION', icon: '🎯', desc: 'Precision strikes, always' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              className="group relative p-8 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl hover:border-cyan-400/50 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              whileHover={{ y: -5 }}
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
              <motion.div
                className="absolute inset-0 bg-cyan-400/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Comic-style panel section
function ComicSection() {
  return (
    <section id="comics" className="relative py-32 px-4 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="text-cyan-400">#</span> COMIC ARCHIVE
          </h2>
          <p className="text-gray-400">The legend unfolds, panel by panel.</p>
        </motion.div>

        {/* Comic panel grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="relative aspect-[4/3] bg-gray-800 rounded-xl overflow-hidden border-2 border-white/10 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl opacity-20">📖</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                <p className="text-white font-mono text-sm">ISSUE 00{i} • COMING SOON</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Footer
function Footer() {
  return (
    <footer className="relative py-12 px-4 bg-black border-t border-white/10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-cyan-400" />
          <span className="text-white font-bold tracking-wider">MAXX 006</span>
        </div>
        <p className="text-gray-500 text-sm">
          © 2025 YAPPYVERSE. ALL RIGHTS RESERVED.
        </p>
        <div className="flex items-center gap-4">
          {/* Audio toggle placeholder */}
          <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <Volume2 className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </footer>
  )
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="min-h-screen bg-black">
      {/* Loading Screen */}
      <AnimatePresence>
        {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence>
        {!isLoading && (
          <>
            <Navbar />
            <HeroSection />
            <MissionSection />
            <ComicSection />
            <Footer />
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
