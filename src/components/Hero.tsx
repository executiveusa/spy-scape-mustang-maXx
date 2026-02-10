'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Target } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video/Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-spy-black/50 to-spy-black" />
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920)',
            filter: 'brightness(0.4)'
          }}
        />
      </div>

      {/* Scan Line Effect */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="scan-line" />
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 text-center">
        {/* Logo/Branding */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-spy-accent" />
            <span className="text-2xl font-mono text-spy-accent">SPYSCAPE</span>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6"
          data-text="MUSTANG MAXX 006"
        >
          <span className="glitch text-white" data-text="MUSTANG MAXX">MUSTANG MAXX</span>
          <br />
          <span className="text-spy-accent">006</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto font-mono"
        >
          Welcome, Agent. Your elite espionage training begins now.
          Master the art of stealth, deception, and tactical precision.
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-8 mb-12"
        >
          <div className="flex items-center gap-2 text-spy-accent">
            <Zap className="w-5 h-5" />
            <span className="font-mono">100+ Training Modules</span>
          </div>
          <div className="flex items-center gap-2 text-spy-gold">
            <Target className="w-5 h-5" />
            <span className="font-mono">Realistic Simulations</span>
          </div>
          <div className="flex items-center gap-2 text-spy-blue">
            <Shield className="w-5 h-5" />
            <span className="font-mono">Elite Instructors</span>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <button className="btn-spy-primary group">
            <span className="relative z-10 flex items-center gap-2">
              Begin Training
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          <button className="btn-spy-secondary">
            View Programs
          </button>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-spy-black to-transparent z-10" />
    </section>
  );
}
