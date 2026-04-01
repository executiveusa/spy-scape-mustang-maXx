'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'

const specs = [
  { label: 'PLATFORM', value: 'Eleanor 2056' },
  { label: 'POWER', value: '2,056 HP' },
  { label: 'DRIVETRAIN', value: 'Quantum V12 Hybrid' },
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
          <div className="w-16 h-px bg-maxx-cyan/40 mt-4" />
        </motion.div>

        {/* Two-column: image + history text */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          <motion.div
            className="relative aspect-[4/3] bg-maxx-panel border border-maxx-border overflow-hidden"
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
              <span className="text-[10px] font-mono text-maxx-cyan tracking-wider bg-maxx-black/70 px-2 py-1">
                THE ICONIC MAXX FROM CHAPTER FIVE
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <p className="text-gray-300 text-base leading-relaxed mb-6">
              The Mustang MAXX is synonymous with Stacy MACS. Fans first saw the two together
              in Chapter One and the car quickly became a much-loved character in its own right.
              Much of the car&apos;s iconic status can be attributed to its upgrades which often
              play a starring role.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed mb-5">
              In Chapter One the list of modifications includes rotating crypto plates,
              AI neural targeting, a drone swarm deployment system, emergency ejector protocol,
              a cloaking mesh and a rear decoy package. In Chapter Two the car returns with
              this same suite and additional EMP burst cannons.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed mb-5">
              When it reappears in Chapter Three it is fitted for personal use with a biometric
              dashboard and a secure satellite uplink. In Chapter Four MAXX wins the car back
              in a high-stakes street race.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed">
              The car is stored in the MACS garage in Chapter Five until MAXX drives it through
              the city&apos;s neon grid in the final sequence. It is now complete with its full
              complement of upgrades including the drone swarm and ejector seat protocol.
            </p>
          </motion.div>
        </div>

        {/* Specs grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="text-[10px] font-mono text-gray-600 tracking-[0.3em] mb-4">VEHICLE SPECIFICATIONS</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
        </motion.div>
      </div>
    </section>
  )
}
