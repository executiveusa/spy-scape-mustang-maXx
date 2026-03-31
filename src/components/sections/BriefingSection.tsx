'use client'

import { motion } from 'framer-motion'
import { Shield, Eye, Brain } from 'lucide-react'

const dossierItems = [
  {
    icon: Eye,
    title: 'AWARENESS',
    text: 'The Master taught that the mind is a series of rooms. Direct your awareness deliberately into one room at a time.',
  },
  {
    icon: Brain,
    title: 'CONCENTRATION',
    text: 'Concentration is not a talent — it is a skill. Like any skill, it can be developed through practice.',
  },
  {
    icon: Shield,
    title: 'UNWAVERING FOCUS',
    text: 'Where awareness goes, energy flows. Commit fully to one task, one mission, until it is complete.',
  },
]

export default function BriefingSection() {
  return (
    <section id="briefing" className="relative py-28 px-5">
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

        {/* Dossier grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {dossierItems.map((item, i) => (
            <motion.div
              key={item.title}
              className="card-noir p-6 group hover:border-maxx-cyan/20 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <item.icon className="w-5 h-5 text-maxx-cyan mb-4" />
              <h3 className="text-sm font-heading font-semibold text-white tracking-wider mb-3">
                {item.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Pull quote */}
        <motion.blockquote
          className="mt-12 border-l-2 border-maxx-cyan/30 pl-6 max-w-2xl"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-gray-400 text-lg italic leading-relaxed">
            &ldquo;One thing at a time. One room at a time. This is how the Agent was trained.
            Not by force — by <span className="text-maxx-cyan">focused intention</span>.&rdquo;
          </p>
          <cite className="block mt-3 text-gray-600 text-xs font-mono tracking-wider not-italic">
            — THE MASTER&apos;S TEACHING
          </cite>
        </motion.blockquote>
      </div>
    </section>
  )
}
