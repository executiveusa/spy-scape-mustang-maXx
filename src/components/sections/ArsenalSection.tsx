'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Cpu, Radio, Zap, Radar, Lock, Cog, Shield, Crosshair, Eye, Layers } from 'lucide-react'
import Image from 'next/image'
import SpotlightCard from '@/components/ui/SpotlightCard'

const gadgets = [
  {
    icon: Layers,
    name: 'CONTROL CLUSTER',
    subtitle: 'Command Interface',
    desc: "MAXX's systems were controlled via a hidden panel concealed beneath the dashboard. This cluster was engineered from original blueprints for the Agency's first active vehicle deployment.",
    status: 'ACTIVE',
  },
  {
    icon: Lock,
    name: 'CRYPTO PLATES',
    subtitle: 'Registration System',
    desc: "The Mustang MAXX's plates rotate to reveal registry entries from different networks. The idea came from the need to operate across multiple jurisdictions without triggering surveillance systems.",
    status: 'ACTIVE',
  },
  {
    icon: Zap,
    name: 'EJECTOR PROTOCOL',
    subtitle: 'Emergency Extraction',
    desc: 'This ejector trigger was used in the operations of Chapter Three. It was reconstructed using the technical drawings from the original Agency spec. Hidden inside the gear assembly, it deploys with a single command.',
    status: 'ACTIVE',
  },
  {
    icon: Shield,
    name: 'EMERGENCY EJECT',
    subtitle: 'Seat Deployment System',
    desc: "The MAXX's ejector seat is a firm favorite among mission planners. In Chapter Three, the system used compressed-air canisters hidden in the seat itself alongside the Chapter Five passenger configuration.",
    status: 'STANDBY',
  },
  {
    icon: Crosshair,
    name: 'BLADE SYSTEM',
    subtitle: 'Perimeter Defense',
    desc: 'In Chapter One, MAXX deploys the extendable blade system to neutralise a pursuing vehicle. The original design was inspired by bladed configurations used on pursuit vehicles in historical conflict records.',
    status: 'ACTIVE',
  },
  {
    icon: Cog,
    name: 'SHIELD PROTOCOL',
    subtitle: 'Bumper Defense Array',
    desc: 'The shield array extends from the front and rear to protect the vehicle during high-stakes encounters â€” two iron hands emerging to absorb impact during any confrontation.',
    status: 'STANDBY',
  },
  {
    icon: Radar,
    name: 'THREAT RADAR',
    subtitle: 'Tracking System',
    desc: 'In Chapter One MAXX attaches a tracking device to a rival vehicle and uses a screen concealed in the dashboard to follow it across the city grid. This technology was decades ahead of what the public would later know as GPS.',
    status: 'ACTIVE',
  },
  {
    icon: Eye,
    name: 'DRONE SWARM',
    subtitle: 'Autonomous Fleet',
    desc: 'The MAXX includes a drone deployment system capable of releasing a coordinated swarm onto the grid. While not seen on screen in Chapter One, a similar system appears in Chapter Three.',
    status: 'ACTIVE',
  },
  {
    icon: Radio,
    name: 'STEALTH LAYER',
    subtitle: 'Active Cloaking',
    desc: 'The stealth layer featured in Chapter Two uses distributed field nodes to force a visual signature collapse. Positioning is critical for maximum effectiveness.',
    status: 'STANDBY',
  },
  {
    icon: Cpu,
    name: 'EMP CANNON',
    subtitle: 'Electronic Warfare',
    desc: 'This double-output EMP module is a prototype of the burst cannons used in Chapter Three operations. It turned out the system was not loaded when MAXX took the vehicle.',
    status: 'STANDBY',
  },
]

export default function ArsenalSection() {
  const carouselRef = useRef<HTMLDivElement>(null)

  return (
    <section id="arsenal" className="relative py-28 bg-maxx-dark">
      <div className="section-container px-5 mb-12">
        <motion.div
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
          <div className="w-16 h-px bg-maxx-cyan/40 mb-8" />
        </motion.div>

        {/* Q's Workshop intro â€” two-column editorial */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-8">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-gray-300 text-base leading-relaxed mb-6">
              Since his first activation, Mustang MAXX has brought little known, cutting-edge
              digital capabilities to a broad audience â€” often through the tools deployed in
              the Agency. This section explores the wide range of tech upgrades the Mustang
              MAXX has carried right up to the present day.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed">
              In an environment inspired by the Agency&apos;s digital workshop, the legendary
              Mustang MAXX â€” used in the operations of Chapter Three â€” is surrounded by the
              systems and tools that power every mission and every specially commissioned
              campaign for MACS Digital Media clients.
            </p>
          </motion.div>

          <motion.div
            className="relative aspect-video bg-maxx-panel border border-maxx-border overflow-hidden"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src="/mustang-maxx-images/ChatGPT%20Image%20May%2012,%202025,%2012_07_22%20AM.png"
              alt="Agency Workshop â€” Mustang MAXX"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-maxx-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <span className="text-[10px] font-mono text-maxx-cyan tracking-wider bg-maxx-black/70 px-2 py-1">
                ITEMS USED IN THE OPERATIONS OF CHAPTER THREE
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* DRAG TO NAVIGATE horizontal carousel â€” travelnextlvl.de architecture */}
      <div className="relative">
        <motion.div
          className="section-container px-5 mb-4 flex items-center gap-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="h-px flex-1 bg-maxx-border" />
          <span className="text-[10px] font-mono text-gray-600 tracking-[0.3em]">DRAG TO NAVIGATE</span>
          <div className="h-px flex-1 bg-maxx-border" />
        </motion.div>

        <div
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto pb-6 px-5 cursor-grab active:cursor-grabbing select-none"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onMouseDown={(e) => {
            const el = carouselRef.current
            if (!el) return
            const startX = e.pageX - el.offsetLeft
            const scrollLeft = el.scrollLeft
            const onMove = (ev: MouseEvent) => {
              const x = ev.pageX - el.offsetLeft
              el.scrollLeft = scrollLeft - (x - startX)
            }
            const onUp = () => {
              window.removeEventListener('mousemove', onMove)
              window.removeEventListener('mouseup', onUp)
            }
            window.addEventListener('mousemove', onMove)
            window.addEventListener('mouseup', onUp)
          }}
        >
          {gadgets.map((g, i) => (
            <SpotlightCard
              key={g.name}
              className="flex-none w-72 md:w-80 group"
            >
            <motion.div
              className="w-full card-noir p-5 relative overflow-hidden"
              style={{ scrollSnapAlign: 'start' }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: Math.min(i * 0.06, 0.4), duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-maxx-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              {g.status === 'ACTIVE' && (
                <div className="absolute top-3 right-3">
                  <span className="relative block w-1.5 h-1.5">
                    <span className="absolute inset-0 bg-emerald-400" />
                    <motion.span
                      className="absolute inset-0 bg-emerald-400/50"
                      animate={{ scale: [1, 2.5, 1], opacity: [1, 0, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <g.icon className="w-5 h-5 text-maxx-cyan group-hover:drop-shadow-[0_0_6px_rgba(70,213,255,0.8)] transition-all" />
                <span
                  className={`text-[10px] font-mono tracking-wider px-2 py-0.5 ${
                    g.status === 'ACTIVE'
                      ? 'text-emerald-400 bg-emerald-400/10'
                      : 'text-maxx-orange bg-maxx-orange/10'
                  }`}
                >
                  {g.status}
                </span>
              </div>

              <p className="text-[9px] font-mono text-maxx-cyan tracking-widest mb-1 uppercase">
                {g.subtitle}
              </p>
              <h3 className="text-sm font-heading font-semibold text-white tracking-wider mb-3">
                {g.name}
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                {g.desc}
              </p>
            </motion.div>
            </SpotlightCard>
          ))}
          <div className="flex-none w-5" />
        </div>
      </div>
    </section>
  )
}
