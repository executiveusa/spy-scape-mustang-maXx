'use client'

import { motion } from 'framer-motion'
import { Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-maxx-black flex items-center justify-center p-4">
      {/* Grid bg */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(70,213,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(70,213,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <motion.div
        className="relative z-10 w-full max-w-sm text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="flex justify-center mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Shield className="w-12 h-12 text-maxx-cyan" />
        </motion.div>

        <p className="text-maxx-cyan font-mono text-xs tracking-[0.4em] mb-3">
          AGENT ACCESS
        </p>
        <h1 className="text-2xl font-heading font-bold text-white mb-4">
          Mustang Maxx 006
        </h1>
        <div className="w-12 h-px bg-maxx-cyan/40 mx-auto mb-6" />

        <p className="text-gray-500 text-sm leading-relaxed mb-10">
          Agent portal access is managed through the IronClaw backend system.
          Full authentication arriving in v2.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-maxx-cyan font-mono text-sm hover:gap-3 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Home
        </Link>
      </motion.div>
    </div>
  )
}
