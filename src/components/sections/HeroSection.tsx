'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  // Deeper parallax — background moves 40% of scroll distance
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08])
  // Content fades and blurs on scroll
  const contentOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0])
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, -60])
  const contentBlur = useTransform(scrollYProgress, [0.1, 0.45], [0, 8])

  return (
    <section
      ref={ref}
      id="hero"
      className="relative h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Parallax background */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ y: bgY, scale: bgScale }}
      >
        <Image
          src="/mustang-maxx-images/ChatGPT%20Image%20May%209,%202025,%2011_08_35%20PM.png"
          alt="Agent 006 — Mustang Maxx"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Layered vignette — noir depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-maxx-black/70 via-maxx-black/20 to-maxx-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-maxx-black/60 via-transparent to-maxx-black/60" />
        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,7,10,0.8)_100%)]" />
      </motion.div>

      {/* Scan line sweep — animates once on load */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-[1]"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-maxx-cyan/60 to-transparent"
          initial={{ top: '0%' }}
          animate={{ top: '100%' }}
          transition={{ duration: 0.8, delay: 0.5, ease: 'linear' }}
        />
      </motion.div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(70,213,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(70,213,255,0.025)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      {/* Horizontal scan lines (CRT effect) */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.08)_2px,rgba(0,0,0,0.08)_4px)] pointer-events-none" />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-5"
        style={{
          opacity: contentOpacity,
          y: contentY,
          filter: useTransform(contentBlur, (v) => `blur(${v}px)`),
        }}
      >
        {/* Agent classification */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="h-px w-8 bg-maxx-cyan/40" />
          <p className="text-maxx-cyan font-mono text-[11px] tracking-[0.5em]">
            AGENT 006 • YAPPYVERSE
          </p>
          <span className="h-px w-8 bg-maxx-cyan/40" />
        </motion.div>

        {/* MUSTANG — clips in from bottom */}
        <div className="overflow-hidden mb-1">
          <motion.h1
            className="text-hero font-heading font-bold text-white tracking-tight leading-none"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.65, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            MUSTANG
          </motion.h1>
        </div>

        {/* MAXX — clips in with glow */}
        <div className="overflow-hidden mb-8">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.65, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-hero font-heading font-bold text-maxx-cyan text-glow-cyan tracking-tight leading-none">
              MAXX
            </span>
          </motion.div>
        </div>

        {/* Tagline */}
        <motion.p
          className="text-gray-400 font-mono text-sm max-w-md mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
        >
          Discover the legend behind the machine.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-12"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <a
            href="#briefing"
            className="px-6 py-2.5 bg-maxx-cyan text-maxx-black font-heading font-semibold text-sm hover:brightness-110 transition-all"
          >
            BEGIN
          </a>
          <a
            href="#mustang"
            className="px-6 py-2.5 border border-maxx-cyan/30 text-maxx-cyan font-heading font-semibold text-sm hover:bg-maxx-cyan/10 transition-all"
          >
            VIEW THE MAXX
          </a>
        </motion.div>

        {/* Opening exhibition copy — SpyScape style */}
        <motion.div
          className="max-w-xl mx-auto border-t border-maxx-border/40 pt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <p className="text-gray-600 font-mono text-[11px] leading-relaxed text-center">
            006×MUSTANG MAXX is a digital experience created by MACS Digital Media and produced
            in collaboration with the Yappyverse network. As you scroll through the content below
            you will find never before seen artwork, original character profiles, custom animations
            and a showcase of legendary scenes featuring Mustang MAXX.
          </p>
        </motion.div>
      </motion.div>

      {/* Scroll down cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-5 h-5 text-maxx-cyan/40" />
        </motion.div>
        <span className="text-[9px] font-mono text-gray-700 tracking-[0.3em]">SCROLL</span>
      </motion.div>
    </section>
  )
}
