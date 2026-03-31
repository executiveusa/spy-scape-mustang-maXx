'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Shield, Zap, Target } from 'lucide-react'

interface LoadingScreenProps {
  onComplete: () => void
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [stage, setStage] = useState(0)
  const stages = [
    { icon: Shield, text: 'INITIALIZING AGENT PROTOCOLS' },
    { icon: Zap, text: 'ESTABLISHING SECURE CONNECTION' },
    { icon: Target, text: 'CALIBRATING SYSTEMS' },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setStage((prev) => {
        if (prev < stages.length - 1) {
          return prev + 1
        } else {
          clearInterval(timer)
          setTimeout(onComplete, 500)
          return prev
        }
      })
    }, 800)

    return () => clearInterval(timer)
  }, [stages.length, onComplete])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-maxx-black"
        exit={{ opacity: 0, transition: { duration: 0.5 } }}
      >
        {/* Subtle grid */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(transparent_1px,_#46d5ff_1px)] bg-[size:50px_50px] opacity-[0.04]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_1px,#46d5ff_1px)] bg-[size:50px_50px] opacity-[0.04]" />
        </div>

        {/* Central logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <Shield className="w-16 h-16 text-maxx-cyan" />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <div className="w-24 h-24 border border-maxx-cyan/20 rounded-full" />
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          >
            <div className="w-28 h-28 border border-maxx-border rounded-full border-dashed" />
          </motion.div>
        </motion.div>

        {/* Brand text */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-xl font-heading font-semibold tracking-[0.3em] text-white"
        >
          MUSTANG MAXX
        </motion.h1>

        {/* Current stage */}
        <motion.div
          key={stage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 flex items-center gap-3"
        >
          {stages[stage].icon && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {(() => {
                const Icon = stages[stage].icon
                return <Icon className="w-4 h-4 text-maxx-cyan" />
              })()}
            </motion.div>
          )}
          <span className="text-maxx-cyan font-mono text-xs tracking-wider">
            {stages[stage].text}
          </span>
        </motion.div>

        {/* Progress bar */}
        <div className="mt-8 w-48 h-px bg-maxx-border overflow-hidden">
          <motion.div
            className="h-full bg-maxx-cyan"
            initial={{ width: '0%' }}
            animate={{ width: `${((stage + 1) / stages.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-8 flex gap-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-maxx-cyan"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        {/* Glitch effect overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: [0, 0.02, 0],
          }}
          transition={{ duration: 0.1, repeat: Infinity }}
          style={{
            background: 'linear-gradient(transparent 50%, rgba(70, 213, 255, 0.04) 50%)',
            backgroundSize: '100% 4px',
          }}
        />
      </motion.div>
    </AnimatePresence>
  )
}
