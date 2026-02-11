'use client'

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Shield, Zap, Target, Menu, X, User } from 'lucide-react'
import Link from 'next/link'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { scrollY } = useScroll()
  const lastScrollY = useRef(0)

  // Hide/show on scroll for mobile
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > 100) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { href: '#mission', label: 'MISSION', icon: Target },
    { href: '#training', label: 'TRAINING', icon: Zap },
    { href: '#gadgets', label: 'GADGETS', icon: Shield },
    { href: '/dashboard', label: 'DASHBOARD', icon: User },
  ]

  return (
    <>
      {/* Desktop Navbar */}
      <motion.nav
        className={`fixed top-4 left-4 right-4 z-50 hidden md:flex items-center justify-between px-6 py-3 rounded-full transition-all duration-300 ${
          isScrolled
            ? 'bg-black/80 backdrop-blur-lg border border-cyan-400/30'
            : 'bg-black/40 backdrop-blur-sm'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Shield className="w-8 h-8 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
          <span className="text-white font-bold tracking-wider text-lg">MAXX 006</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-full transition-all duration-200 text-sm font-mono tracking-wider"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>

        {/* Auth Button */}
        <Link
          href="/login"
          className="flex items-center gap-2 px-5 py-2 bg-cyan-400/10 border border-cyan-400/50 text-cyan-400 rounded-full hover:bg-cyan-400/20 transition-all duration-200 text-sm font-mono"
        >
          <User className="w-4 h-4" />
          AGENT ACCESS
        </Link>
      </motion.nav>

      {/* Mobile Navbar - Bottom fixed for one-handed use */}
      <motion.nav
        className={`fixed bottom-4 left-4 right-4 z-50 md:hidden flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 ${
          isScrolled
            ? 'bg-black/90 backdrop-blur-lg border border-cyan-400/30'
            : 'bg-black/60 backdrop-blur-md'
        }`}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
      >
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {navItems.slice(0, 3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors"
            >
              <item.icon className="w-5 h-5" />
            </Link>
          ))}
        </div>
      </motion.nav>

      {/* Mobile Full-screen Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center justify-center h-full p-8">
              {/* Close button */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-8 right-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Logo */}
              <Shield className="w-20 h-20 text-cyan-400 mb-8" />
              <h1 className="text-3xl font-bold text-white tracking-[0.3em] mb-12">
                MUSTANG MAXX
              </h1>

              {/* Menu Items */}
              <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-4 w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white hover:text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400/30 transition-all duration-200"
                    >
                      <item.icon className="w-6 h-6" />
                      <span className="font-mono tracking-wider">{item.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Auth Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-12"
              >
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-8 py-4 bg-cyan-400 text-black rounded-xl font-bold tracking-wider hover:bg-cyan-300 transition-colors"
                >
                  <User className="w-5 h-5" />
                  AGENT ACCESS
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
