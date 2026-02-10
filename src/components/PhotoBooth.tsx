'use client';

import { motion } from 'framer-motion';
import { Camera, Instagram, Facebook, Twitter } from 'lucide-react';

export default function PhotoBooth() {
  return (
    <section className="py-24 bg-spy-dark relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-spy-accent/5 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-spy-gold/5 rounded-full filter blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-spy-accent font-mono text-sm uppercase tracking-widest">
            Memory Capture
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Photo <span className="text-spy-accent">Booth</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Capture your moment as a legendary spy. Our photo booth transforms 
            you into your favorite secret agent character.
          </p>
        </motion.div>

        {/* Photo Booth Interface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="spy-card p-8">
            {/* Camera Frame */}
            <div className="relative aspect-video bg-spy-black rounded-lg overflow-hidden mb-8 border-2 border-spy-accent/30">
              {/* Camera Viewfinder Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-spy-accent mx-auto mb-4 animate-pulse" />
                  <p className="font-mono text-spy-accent">Camera Ready</p>
                  <p className="text-xs text-gray-500 mt-2">Position yourself for the perfect shot</p>
                </div>
              </div>
              
              {/* Corner Markers */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-spy-accent" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-spy-accent" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-spy-accent" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-spy-accent" />
              
              {/* Recording Indicator */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                <div className="w-3 h-3 bg-spy-red rounded-full animate-pulse" />
                <span className="font-mono text-xs text-spy-red">REC</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2">
                <button className="btn-spy-primary text-sm">
                  Take Photo
                </button>
                <button className="btn-spy-secondary text-sm">
                  Record Video
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400 font-mono">Share:</span>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg bg-spy-gray hover:bg-spy-accent/20 transition-colors">
                    <Instagram className="w-5 h-5 text-gray-400 hover:text-spy-accent" />
                  </button>
                  <button className="p-2 rounded-lg bg-spy-gray hover:bg-spy-accent/20 transition-colors">
                    <Facebook className="w-5 h-5 text-gray-400 hover:text-spy-accent" />
                  </button>
                  <button className="p-2 rounded-lg bg-spy-gray hover:bg-spy-accent/20 transition-colors">
                    <Twitter className="w-5 h-5 text-gray-400 hover:text-spy-accent" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Gallery Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 mb-4">Recent Captures</p>
          <div className="flex justify-center gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-20 h-20 rounded-lg bg-spy-gray border border-spy-accent/30 animate-pulse"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
