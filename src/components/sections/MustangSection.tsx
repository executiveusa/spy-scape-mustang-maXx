'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'

const specs = [
  { label: 'ENGINE', value: 'Quantum V12 Hybrid' },
  { label: 'POWER', value: '2,056 HP' },
  { label: 'CHASSIS', value: 'Eleanor 2056 Platform' },
  { label: '0-60', value: '1.4 seconds' },
  { label: 'RANGE', value: 'Unlimited (chrono-cell)' },
  { label: 'AI SYSTEM', value: 'Neural Link v6.0' },
]

export default function MustangSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const imgX = useTransform(scrollYProgress, [0, 0.5], [60, 0])
  const imgOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1])

  return (
    <section ref={ref} id="mustang" className="relative py-28 px-5">
      <div className="section-container">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-maxx-cyan font-mono text-xs tracking-[0.3em] mb-3">
            // SECTION 03
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            The Mustang MAXX
          </h2>
          <p className="text-gray-500 text-sm max-w-lg">
            Based on the legendary Eleanor — reimagined for 2056.
            Built for one purpose: absolute concentration at velocity.
          </p>
          <div className="w-16 h-px bg-maxx-cyan/40 mt-4" />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Car image */}
          <motion.div
            className="relative aspect-[4/3] rounded-lg overflow-hidden bg-maxx-panel border border-maxx-border"
            style={{ x: imgX, opacity: imgOpacity }}
          >
            <Image
              src="/mustang-maxx-images/ChatGPT%20Image%20May%2012,%202025,%2012_08_54%20AM.png"
              alt="Mustang MAXX Eleanor 2056"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-maxx-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <span className="text-[10px] font-mono text-maxx-cyan tracking-wider bg-maxx-black/70 px-2 py-1 rounded">
                VIP 006 • CHRONO-LANE ACCESS
              </span>
            </div>
          </motion.div>

          {/* Specs */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              {specs.map((spec, i) => (
                <motion.div
                  key={spec.label}
                  className="card-noir p-4"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                >
                  <p className="text-[10px] font-mono text-gray-600 tracking-wider mb-1">
                    {spec.label}
                  </p>
                  <p className="text-sm font-heading font-semibold text-white">
                    {spec.value}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.p
              className="mt-6 text-gray-500 text-sm leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              The original Mustang Eleanor was about raw American muscle. The MAXX
              is about what happens when you harness that power with
              <span className="text-maxx-cyan"> disciplined focus</span> — the same
              principle The Master taught. One direction. Total commitment.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  )
}
