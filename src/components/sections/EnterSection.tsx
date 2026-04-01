'use client'

import { motion } from 'framer-motion'
import { Shield, ArrowRight } from 'lucide-react'

export default function EnterSection() {
  return (
    <section id="enter" className="relative py-32 px-5">
      <div className="section-container">
        {/* Section header */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-maxx-cyan font-mono text-xs tracking-[0.3em] mb-3">
            // SECTION 06
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            Enter the Agency
          </h2>
          <div className="w-16 h-px bg-maxx-cyan/40" />
        </motion.div>

        {/* Screening Room copy — SpyScape adapted */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-gray-300 text-base leading-relaxed mb-6">
              This final section marks a return to the full experience — an opportunity
              to remember the Mustang MAXX in all its glory, full size and full signal.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              006×MUSTANG MAXX is an ongoing digital experience by MACS Digital Media,
              produced in collaboration with the Yappyverse network. The story continues
              as MAXX and MACS build the next chapter of the Agency together.
            </p>
            <p className="text-[9px] font-mono text-gray-700 tracking-widest">
              &copy; 2024–{new Date().getFullYear()} MACS DIGITAL MEDIA AND YAPPYVERSE NETWORK.
              ALL RIGHTS RESERVED.
            </p>
          </motion.div>

          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <Shield className="w-12 h-12 text-maxx-cyan mb-6 mx-auto lg:mx-0" />

            <p className="text-gray-500 text-sm max-w-sm mx-auto lg:mx-0 mb-8 leading-relaxed">
              Join the Agency. Become part of the story.
              Chapter Six begins now.
            </p>

            <motion.a
              href="https://github.com/executiveusa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-maxx-cyan text-maxx-black font-heading font-semibold text-sm hover:brightness-110 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              ACCEPT MISSION
              <ArrowRight className="w-4 h-4" />
            </motion.a>
          </motion.div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="section-container pt-6 border-t border-maxx-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-maxx-cyan" />
          <span className="text-white text-xs font-heading tracking-wider">
            MAXX <span className="text-maxx-cyan">006</span>
          </span>
        </div>
        <p className="text-gray-600 text-xs font-mono">
          &copy; {new Date().getFullYear()} MACS DIGITAL MEDIA • YAPPYVERSE
        </p>
        <p className="text-gray-700 text-[10px] font-mono tracking-widest">
          START OVER —{' '}
          <a href="#hero" className="hover:text-maxx-cyan transition-colors">RETURN TO TOP</a>
        </p>
      </div>
    </section>
  )
}
