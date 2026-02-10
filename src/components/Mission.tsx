'use client';

import { motion } from 'framer-motion';
import { Eye, Lock, Crosshair } from 'lucide-react';

const missionPoints = [
  {
    icon: Eye,
    title: 'Surveillance Mastery',
    description: 'Learn advanced surveillance techniques used by elite intelligence agencies worldwide.',
  },
  {
    icon: Lock,
    title: 'Covert Operations',
    description: 'Master the art of invisible infiltration and undetectable presence.',
  },
  {
    icon: Crosshair,
    title: 'Tactical Precision',
    description: 'Develop pinpoint accuracy and strategic decision-making under pressure.',
  },
];

export default function Mission() {
  return (
    <section className="py-24 bg-spy-dark relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-spy-accent rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-spy-blue rounded-full filter blur-3xl" />
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
            Classified Briefing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Your <span className="text-spy-accent">Mission</span> Awaits
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Welcome to the world's most advanced espionage training facility. 
            Here, ordinary individuals become extraordinary agents.
          </p>
        </motion.div>

        {/* Mission Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {missionPoints.map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="spy-card group"
            >
              <div className="mb-6">
                <div className="inline-flex p-4 rounded-full bg-spy-gray group-hover:bg-spy-accent/10 transition-colors">
                  <point.icon className="w-8 h-8 text-spy-accent group-hover:text-spy-accent transition-colors" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4 group-hover:text-spy-accent transition-colors">
                {point.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {point.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-20 text-center"
        >
          <blockquote className="text-2xl md:text-3xl font-mono text-spy-accent max-w-4xl mx-auto">
            "The difference between a spy and a legend is training."
          </blockquote>
          <cite className="block mt-4 text-gray-500 not-italic">
            — Mustang Maxx 006, Elite Training Division
          </cite>
        </motion.div>
      </div>
    </section>
  );
}
