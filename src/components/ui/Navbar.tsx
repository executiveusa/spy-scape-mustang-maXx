'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Shield, Zap, Target, Car, Menu, X } from 'lucide-react'

const navItems = [
  { href: '#briefing', label: 'BRIEFING', icon: Target },
  { href: '#arsenal', label: 'ARSENAL', icon: Zap },
  { href: '#mustang', label: 'THE MAXX', icon: Car },
  { href: '#mission', label: 'MISSION', icon: Shield },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Desktop */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 hidden md:flex items-center justify-between px-8 py-4 transition-colors duration-300 ${
          scrolled ? 'bg-maxx-black/90 backdrop-blur-md border-b border-maxx-border' : 'bg-transparent'
        }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <a href="#" className="flex items-center gap-2.5 group">
          <Shield className="w-6 h-6 text-maxx-cyan" />
          <span className="text-white font-heading font-semibold tracking-wider text-sm">
            MAXX <span className="text-maxx-cyan">006</span>
          </span>
        </a>

        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-maxx-cyan text-xs font-mono tracking-wider transition-colors"
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </a>
          ))}
        </div>

        <a
          href="#enter"
          className="px-4 py-1.5 text-xs font-mono tracking-wider text-maxx-cyan border border-maxx-cyan/30 hover:bg-maxx-cyan/10 transition-colors"
        >
          ENTER AGENCY
        </a>
      </motion.nav>

      {/* Mobile bottom bar */}
      <motion.nav
        className="fixed bottom-4 left-4 right-4 z-50 md:hidden flex items-center justify-between px-4 py-3 bg-maxx-black/90 backdrop-blur-md border border-maxx-border rounded-sm"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-maxx-cyan"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          {navItems.slice(0, 3).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="p-2 text-gray-500 hover:text-maxx-cyan transition-colors"
            >
              <item.icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      </motion.nav>

      {/* Mobile fullscreen menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[60] bg-maxx-black/98 backdrop-blur-xl flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-6 right-6 p-3 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <Shield className="w-14 h-14 text-maxx-cyan mb-6" />
            <h2 className="text-xl font-heading font-semibold tracking-[0.3em] text-white mb-10">
              MUSTANG MAXX
            </h2>

            <div className="flex flex-col gap-3 w-72">
              {navItems.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-5 py-3 text-gray-300 hover:text-maxx-cyan border-l-2 border-maxx-border hover:border-maxx-cyan transition-colors font-mono text-sm tracking-wider"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
