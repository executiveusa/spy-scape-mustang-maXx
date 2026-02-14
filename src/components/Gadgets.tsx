'use client';

import { motion } from 'framer-motion';
import { Smartphone, Watch, Camera, Mic, Key, Radio } from 'lucide-react';

const gadgets = [
  {
    name: 'Encrypted Phone',
    description: 'Military-grade encryption for secure communications.',
    icon: Smartphone,
    availability: 'Available',
  },
  {
    name: 'Spy Watch',
    description: 'Built-in laser cutter, toxin detector, and EMP.',
    icon: Watch,
    availability: 'Available',
  },
  {
    name: 'Hidden Camera',
    description: '4K covert recording with night vision.',
    icon: Camera,
    availability: 'Limited',
  },
  {
    name: 'Wiretap Device',
    description: 'Long-range audio interception system.',
    icon: Mic,
    availability: 'Available',
  },
  {
    name: 'Lock Pick Set',
    description: 'Professional grade, 50+ configurations.',
    icon: Key,
    availability: 'Available',
  },
  {
    name: 'Signal Jammer',
    description: 'Blocks all nearby electronic surveillance.',
    icon: Radio,
    availability: 'Restricted',
  },
];

export default function Gadgets() {
  return (
    <section className="py-24 bg-spy-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-spy-black via-spy-dark to-spy-black" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 136, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
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
          <span className="text-spy-red font-mono text-sm uppercase tracking-widest">
            Q Branch
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Elite <span className="text-spy-red">Gadgets</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Every secret agent needs the right tools. Browse our arsenal of 
            cutting-edge espionage equipment.
          </p>
        </motion.div>

        {/* Gadgets Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gadgets.map((gadget, index) => (
            <motion.div
              key={gadget.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="spy-card group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="inline-flex p-4 rounded-lg bg-spy-gray group-hover:bg-spy-red/10 transition-colors">
                    <gadget.icon className="w-8 h-8 text-spy-red group-hover:text-spy-red transition-colors" />
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold group-hover:text-spy-red transition-colors">
                      {gadget.name}
                    </h3>
                    <span className={`text-xs font-mono px-2 py-1 rounded ${
                      gadget.availability === 'Available' 
                        ? 'bg-spy-accent/10 text-spy-accent'
                        : gadget.availability === 'Limited'
                        ? 'bg-spy-gold/10 text-spy-gold'
                        : 'bg-spy-red/10 text-spy-red'
                    }`}>
                      {gadget.availability}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {gadget.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <button className="btn-spy-secondary">
            Request Equipment
          </button>
        </motion.div>
      </div>
    </section>
  );
}
