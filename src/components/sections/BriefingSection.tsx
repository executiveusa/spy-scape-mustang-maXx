'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function BriefingSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const lineWidth = useTransform(scrollYProgress, [0.1, 0.5], ['0%', '100%'])

  return (
    <section ref={ref} id="briefing" className="relative py-28 px-5">
      {/* Animated horizontal accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-maxx-border overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-transparent via-maxx-cyan/50 to-transparent"
          style={{ width: lineWidth }}
        />
      </div>

      <div className="section-container">
        {/* Header */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-maxx-cyan font-mono text-xs tracking-[0.3em] mb-3">
            // SECTION 01
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            The Briefing
          </h2>
          <div className="w-16 h-px bg-maxx-cyan/40" />
        </motion.div>

        {/* Main editorial body — SpyScape Q's Briefing adapted */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-gray-300 text-base leading-relaxed mb-6">
              The unforgettable moment in Chapter One in which Mustang MAXX is first activated
              by MACS — his handler, architect and digital tactician — captivated audiences
              across every platform and saw the role of MACS begin to grow within the Yappyverse.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed">
              The origins of MAXX go back much further, to the founder of MACS Digital Media,
              whose vision for a brand built on loyalty, speed and street knowledge sparked
              the creation of this character. That character was inspired, in part, by the
              classic American muscle car — a machine already steeped in counterculture myth.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              His concepts included encrypted comm channels hidden in street-level business
              tools and data systems which could be used as intelligence networks. Many of
              these original Agency blueprints form part of the MACS archive.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed">
              Another inspiration for the character was a car performance specialist whose
              knowledge of American muscle mechanics deeply influenced the design philosophy.
              A reference to this influence appears in early MAXX character sketches and in the
              Yappyverse lore MACS is sometimes referred to by his field designation.
            </p>
          </motion.div>
        </div>

        {/* Section divider with quote */}
        <motion.blockquote
          className="border-l-2 border-maxx-cyan/30 pl-6 max-w-2xl"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-gray-400 text-lg italic leading-relaxed">
            &ldquo;As you scroll through the content below you will find never before seen artwork,
            original character profiles, custom animations and a showcase of legendary scenes
            featuring{' '}
            <span className="text-maxx-cyan not-italic">Mustang MAXX</span>.&rdquo;
          </p>
        </motion.blockquote>
      </div>
    </section>
  )
}
}
