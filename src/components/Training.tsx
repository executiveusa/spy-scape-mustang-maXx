'use client';

import { motion } from 'framer-motion';
import { Brain, Zap, Shield, Target, Users, Clock, Eye } from 'lucide-react';

const trainingPrograms = [
  {
    title: 'Infiltration Mastery',
    description: 'Learn to enter any facility undetected.',
    icon: Users,
    duration: '4 Weeks',
    level: 'Advanced',
    color: 'text-spy-red',
  },
  {
    title: 'Cyber Warfare',
    description: 'Hack systems and bypass security protocols.',
    icon: Brain,
    duration: '6 Weeks',
    level: 'Expert',
    color: 'text-spy-blue',
  },
  {
    title: 'Combat Training',
    description: 'Hand-to-hand combat and tactical weapons.',
    icon: Zap,
    duration: '8 Weeks',
    level: 'All Levels',
    color: 'text-spy-gold',
  },
  {
    title: 'Surveillance',
    description: 'Track targets without being detected.',
    icon: Eye,
    duration: '3 Weeks',
    level: 'Intermediate',
    color: 'text-spy-accent',
  },
];

export default function Training() {
  return (
    <section className="py-24 bg-spy-black relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-spy-gold font-mono text-sm uppercase tracking-widest">
            Elite Programs
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Training <span className="text-spy-gold">Programs</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Choose your path. Each program is designed by veteran intelligence officers
            to prepare you for real-world espionage scenarios.
          </p>
        </motion.div>

        {/* Training Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trainingPrograms.map((program, index) => (
            <motion.div
              key={program.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="spy-card cursor-pointer group"
            >
              <div className="mb-4">
                <div className={`inline-flex p-3 rounded-lg bg-spy-gray group-hover:bg-spy-gold/10 transition-colors ${program.color}`}>
                  <program.icon className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-spy-gold transition-colors">
                {program.title}
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {program.description}
              </p>
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1 text-spy-accent">
                  <Clock className="w-3 h-3" />
                  {program.duration}
                </div>
                <div className="flex items-center gap-1 text-spy-gold">
                  <Target className="w-3 h-3" />
                  {program.level}
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
          <button className="btn-spy-primary">
            Enroll Now
          </button>
        </motion.div>
      </div>
    </section>
  );
}
