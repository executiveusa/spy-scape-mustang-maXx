'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const panels = [
  {
    image: '/mustang-maxx-images/ChatGPT%20Image%20May%2012,%202025,%2012_07_22%20AM.png',
    caption: 'CHAPTER 01 — THE CALL',
    text: 'The city never sleeps. Neither does Agent 006.',
  },
  {
    image: '/mustang-maxx-images/ChatGPT%20Image%20May%2012,%202025,%2012_07_35%20AM.png',
    caption: 'CHAPTER 02 — THE CHASE',
    text: 'Focus is the weapon. Distraction is the enemy.',
  },
  {
    image: '/mustang-maxx-images/ChatGPT%20Image%20May%2012,%202025,%2012_08_09%20AM.png',
    caption: 'CHAPTER 03 — THE LESSON',
    text: '"One room at a time," The Master said.',
  },
  {
    image: '/mustang-maxx-images/ChatGPT%20Image%20May%2012,%202025,%2012_08_35%20AM.png',
    caption: 'CHAPTER 04 — THE BREAKTHROUGH',
    text: 'When awareness and action become one.',
  },
]

export default function MissionSection() {
  return (
    <section id="mission" className="relative py-28 px-5 bg-maxx-dark">
      <div className="section-container">
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-maxx-cyan font-mono text-xs tracking-[0.3em] mb-3">
            // SECTION 04
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            The Mission
          </h2>
          <p className="text-gray-500 text-sm max-w-lg">
            Every mission is a story. Every story teaches focus.
          </p>
          <div className="w-16 h-px bg-maxx-cyan/40 mt-4" />
        </motion.div>

        {/* Comic panels — 2x2 grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {panels.map((panel, i) => (
            <motion.div
              key={panel.caption}
              className="group relative aspect-[4/3] bg-maxx-panel border border-maxx-border rounded-lg overflow-hidden"
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
            >
              <Image
                src={panel.image}
                alt={panel.caption}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-maxx-black via-maxx-black/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-[10px] font-mono text-maxx-cyan tracking-wider mb-1.5">
                  {panel.caption}
                </p>
                <p className="text-white text-sm font-heading">
                  {panel.text}
                </p>
              </div>

              {/* Corner border accent */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-maxx-cyan/20 rounded-tl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-maxx-cyan/20 rounded-br-lg" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
