'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface LoadingScreenProps {
  onComplete: () => void
}

const DIGITS = ['0', '0', '6']

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [revealed, setRevealed] = useState(0)
  const [exiting, setExiting] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    // If reduced motion is preferred, skip animation and complete immediately
    if (prefersReducedMotion) {
      setRevealed(3)
      setExiting(true)
      setTimeout(onComplete, 100)
      return
    }

    const t1 = setTimeout(() => setRevealed(1), 500)
    const t2 = setTimeout(() => setRevealed(2), 1000)
    const t3 = setTimeout(() => setRevealed(3), 1500)
    const t4 = setTimeout(() => {
      setExiting(true)
      setTimeout(onComplete, 600)
    }, 2400)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [onComplete, prefersReducedMotion])

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-maxx-black"
          exit={{ opacity: 0, transition: { duration: prefersReducedMotion ? 0.1 : 0.6, ease: 'easeOut' } }}
        >
          {/* Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(70,213,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(70,213,255,0.025)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

          {/* Scan line sweep */}
          <motion.div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-maxx-cyan/50 to-transparent pointer-events-none"
            initial={{ top: '0%' }}
            animate={{ top: '100%' }}
            transition={{ duration: 1.8, ease: 'linear', repeat: Infinity }}
          />

          {/* Clock digits — 0 → 0 → 6 */}
          <div className="flex items-end gap-2 mb-6">
            {DIGITS.map((digit, i) => (
              <div key={i} className="relative overflow-hidden">
                <motion.span
                  className="block font-heading font-bold leading-none tabular-nums select-none"
                  style={{ fontSize: 'clamp(5rem, 18vw, 9rem)' }}
                  initial={{ opacity: 0.08, color: '#1a2030' }}
                  animate={
                    revealed > i
                      ? {
                          opacity: 1,
                          color: i === 2 ? '#46d5ff' : '#ffffff',
                          textShadow:
                            i === 2
                              ? '0 0 30px rgba(70,213,255,0.6), 0 0 60px rgba(70,213,255,0.3)'
                              : 'none',
                        }
                      : { opacity: 0.08, color: '#1a2030' }
                  }
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {revealed > i ? digit : '—'}
                </motion.span>
                {/* Reveal flash */}
                {revealed === i + 1 && (
                  <motion.div
                    className="absolute inset-0 bg-maxx-cyan/20"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Classification label — appears after all 3 digits */}
          <motion.p
            className="text-maxx-cyan font-mono text-[11px] tracking-[0.5em] mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: revealed >= 3 ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          >
            AGENT CLASSIFICATION: ACTIVE
          </motion.p>

          {/* Brand sub-label */}
          <motion.p
            className="font-mono text-[10px] tracking-[0.4em] text-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: revealed >= 3 ? 1 : 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            MUSTANG MAXX × MACS DIGITAL MEDIA
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
