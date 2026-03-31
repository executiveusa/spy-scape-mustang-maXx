'use client'

import { motion } from 'framer-motion'
import { Cpu, Radio, Zap, Radar, Lock, Cog } from 'lucide-react'

const gadgets = [
  {
    icon: Cpu,
    name: 'AI NEURAL LINK',
    desc: 'Direct your awareness into one stream. The Neural Link amplifies singular focus.',
    status: 'ACTIVE',
  },
  {
    icon: Lock,
    name: 'CRYPTO-LEDGER PLATES',
    desc: 'Every transaction sealed in iron. Immutable records for the Agency.',
    status: 'ACTIVE',
  },
  {
    icon: Radio,
    name: 'COMM ARRAY',
    desc: 'Encrypted channels across the Yappyverse. Voice avatar on all frequencies.',
    status: 'STANDBY',
  },
  {
    icon: Radar,
    name: 'THREAT RADAR',
    desc: 'Perimeter scanning. Situational awareness is the first defence.',
    status: 'ACTIVE',
  },
  {
    icon: Zap,
    name: 'TURBO DRIVE',
    desc: 'Emergency eject + boost protocol. When focus meets velocity.',
    status: 'STANDBY',
  },
  {
    icon: Cog,
    name: 'DRONE SWARM',
    desc: 'Autonomous fleet of micro-agents. Delegation without distraction.',
    status: 'ACTIVE',
  },
]

export default function ArsenalSection() {
  return (
    <section id="arsenal" className="relative py-28 px-5 bg-maxx-dark">
      <div className="section-container">
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-maxx-cyan font-mono text-xs tracking-[0.3em] mb-3">
            // SECTION 02
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            The Arsenal
          </h2>
          <p className="text-gray-500 text-sm max-w-lg">
            Every tool is a focus multiplier. The Agent chooses precision over volume.
          </p>
          <div className="w-16 h-px bg-maxx-cyan/40 mt-4" />
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {gadgets.map((g, i) => (
            <motion.div
              key={g.name}
              className="card-noir p-5 group hover:border-maxx-cyan/20 transition-colors"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <div className="flex items-start justify-between mb-3">
                <g.icon className="w-5 h-5 text-maxx-cyan" />
                <span
                  className={`text-[10px] font-mono tracking-wider px-2 py-0.5 rounded ${
                    g.status === 'ACTIVE'
                      ? 'text-emerald-400 bg-emerald-400/10'
                      : 'text-maxx-orange bg-maxx-orange/10'
                  }`}
                >
                  {g.status}
                </span>
              </div>
              <h3 className="text-xs font-heading font-semibold text-white tracking-wider mb-2">
                {g.name}
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                {g.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
