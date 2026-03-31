'use client'

import { useRef, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, 200])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])

  return (
    <section
      ref={ref}
      id="hero"
      className="relative h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background image — Agent 006 poster */}
      <motion.div
        className="absolute inset-0"
        style={{ y }}
      >
        <Image
          src="/mustang-maxx-images/ChatGPT%20Image%20May%209,%202025,%2011_08_35%20PM.png"
          alt="Agent 006 — Mustang Maxx"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Dark overlay with vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-maxx-black/60 via-maxx-black/30 to-maxx-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-maxx-black/50 via-transparent to-maxx-black/50" />
      </motion.div>

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(70,213,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(70,213,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-5"
        style={{ opacity, scale }}
      >
        <motion.p
          className="text-maxx-cyan font-mono text-xs tracking-[0.4em] mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          AGENT 006 • YAPPYVERSE
        </motion.p>

        <motion.h1
          className="text-hero font-heading font-bold text-white tracking-tight leading-none mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          MUSTANG
          <br />
          <span className="text-maxx-cyan text-glow-cyan">MAXX</span>
        </motion.h1>

        <motion.p
          className="text-gray-400 font-mono text-sm max-w-md mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Where awareness goes, energy flows.
          <br />
          The Agency requires one thing: <span className="text-maxx-cyan">Unwavering Focus.</span>
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <a
            href="#briefing"
            className="px-6 py-2.5 bg-maxx-cyan text-maxx-black font-heading font-semibold text-sm rounded-lg hover:brightness-110 transition-all"
          >
            BEGIN MISSION
          </a>
          <a
            href="#mustang"
            className="px-6 py-2.5 border border-maxx-cyan/30 text-maxx-cyan font-heading font-semibold text-sm rounded-lg hover:bg-maxx-cyan/10 transition-all"
          >
            VIEW THE MAXX
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="w-5 h-5 text-maxx-cyan/40" />
      </motion.div>
    </section>
  )
}
