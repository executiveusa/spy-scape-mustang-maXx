'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const panels = [
  {
    image: '/mustang-maxx-images/ChatGPT%20Image%20May%2012,%202025,%2012_07_22%20AM.png',
    caption: 'CHAPTER 01 — THE CALL',
    text: 'The city never sleeps. Neither does Agent 006.',
    from: { x: -50, opacity: 0 },
  },
  {
    image: '/mustang-maxx-images/ChatGPT%20Image%20May%2012,%202025,%2012_07_35%20AM.png',
    caption: 'CHAPTER 02 — THE CHASE',
    text: 'The pursuit was real, carefully engineered and cut together with live-capture content.',
    from: { x: 50, opacity: 0 },
  },
  {
    image: '/mustang-maxx-images/ChatGPT%20Image%20May%2012,%202025,%2012_08_09%20AM.png',
    caption: 'CHAPTER 03 — THE NIGHT RUN',
    text: 'By Chapter Five, the MAXX was fully established as a Yappyverse character in its own right.',
    from: { x: -50, opacity: 0 },
  },
  {
    image: '/mustang-maxx-images/ChatGPT%20Image%20May%2012,%202025,%2012_08_35%20AM.png',
    caption: 'CHAPTER 04 — THE BREAKTHROUGH',
    text: 'Two versions: one in hero condition for operations, one prepared for the final sequence.',
    from: { x: 50, opacity: 0 },
  },
]

export default function MissionSection() {
  return (
    <section id="mission" className="relative py-28 px-5 bg-maxx-dark">
      <div className="section-container">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-maxx-cyan font-mono text-xs tracking-[0.3em] mb-3">
            // SECTION 05
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            The Night Run
          </h2>
          <div className="w-16 h-px bg-maxx-cyan/40 mb-8" />
        </motion.div>

        {/* Editorial intro */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-gray-300 text-base leading-relaxed mb-6">
              By Chapter Five, the Mustang MAXX was fully established as a Yappyverse
              character in its own right, making its pursuit during the explosive Night Run
              sequence all the more electric.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed">
              MACS Digital campaigns are known for spectacular, carefully engineered content
              drops and for this chapter the team needed to find a way to capture the car,
              the city and a pursuit sequence as realistically and cinematically as possible.
              To achieve this they created a full digital recreation of each element,
              choreographed their carefully planned sequence, and intercut footage with
              live-capture content from the real shoot.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <p className="text-gray-500 text-sm leading-relaxed mb-5">
              This section is centered around the digital recreation of the MAXX from
              Chapter Five — built then heavily distressed for the later stages of the
              Night Run sequence. Around it you can see oversized technical drawings which
              the art director re-drew from originals, so it appears as if the city grid
              is protruding from these plans.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed">
              In this section, four of the key players in bringing this sequence to life
              talk through the plans, models and concept artwork they designed and used
              to achieve this memorable chapter.
            </p>
          </motion.div>
        </div>

        {/* Comic panels — alternate left/right reveal */}
        <div className="grid md:grid-cols-2 gap-4">
          {panels.map((panel, i) => (
            <motion.div
              key={panel.caption}
              className="group relative aspect-[4/3] bg-maxx-panel border border-maxx-border overflow-hidden"
              initial={panel.from}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image
                src={panel.image}
                alt={panel.caption}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-maxx-black via-maxx-black/20 to-transparent" />

              {/* Comic corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-maxx-cyan/30" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-maxx-cyan/30" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-maxx-cyan/30" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-maxx-cyan/30" />

              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-[10px] font-mono text-maxx-cyan tracking-wider mb-1.5">
                  {panel.caption}
                </p>
                <p className="text-white text-sm font-heading">
                  {panel.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
