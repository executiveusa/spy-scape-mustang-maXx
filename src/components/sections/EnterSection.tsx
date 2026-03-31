'use client'

import { motion } from 'framer-motion'
import { Shield, ArrowRight } from 'lucide-react'

export default function EnterSection() {
  return (
    <section id="enter" className="relative py-32 px-5">
      <div className="section-container text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Shield className="w-10 h-10 text-maxx-cyan mx-auto mb-6" />

          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            Enter the Agency
          </h2>

          <p className="text-gray-500 text-sm max-w-md mx-auto mb-10 leading-relaxed">
            Train your focus. Build with the Yappyverse.
            Agent 006 is waiting.
          </p>

          <motion.a
            href="https://github.com/executiveusa"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-maxx-cyan text-maxx-black font-heading font-semibold text-sm rounded-lg hover:brightness-110 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ACCEPT MISSION
            <ArrowRight className="w-4 h-4" />
          </motion.a>
        </motion.div>
      </div>

      {/* Footer bar */}
      <div className="section-container mt-24 pt-6 border-t border-maxx-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-maxx-cyan" />
          <span className="text-white text-xs font-heading tracking-wider">
            MAXX <span className="text-maxx-cyan">006</span>
          </span>
        </div>
        <p className="text-gray-600 text-xs font-mono">
          &copy; {new Date().getFullYear()} MACS DIGITAL MEDIA • YAPPYVERSE
        </p>
      </div>
    </section>
  )
}
