'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Star, TrendingUp, Award } from 'lucide-react';

const skillsData = [
  { name: 'Stealth', level: 95, category: 'Physical' },
  { name: 'Hacking', level: 88, category: 'Technical' },
  { name: 'Combat', level: 92, category: 'Physical' },
  { name: 'Disguise', level: 85, category: 'Social' },
  { name: 'Surveillance', level: 90, category: 'Technical' },
  { name: 'Escape', level: 87, category: 'Physical' },
  { name: 'Languages', level: 82, category: 'Social' },
  { name: 'Weapons', level: 94, category: 'Physical' },
];

const categories = ['All', 'Physical', 'Technical', 'Social'];

export default function Skills() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredSkills = activeCategory === 'All' 
    ? skillsData 
    : skillsData.filter(s => s.category === activeCategory);

  return (
    <section className="py-24 bg-spy-gray relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-spy-accent rounded-full" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-spy-accent rounded-full" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-spy-accent rounded-full" />
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
          <span className="text-spy-blue font-mono text-sm uppercase tracking-widest">
            Agent Assessment
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Skills <span className="text-spy-blue">Evaluation</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Test your abilities across multiple domains. Your mission readiness 
            depends on mastering all skill categories.
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-full font-mono text-sm transition-all ${
                activeCategory === category
                  ? 'bg-spy-blue text-spy-black'
                  : 'bg-spy-dark text-gray-400 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Skills Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredSkills.map((skill, index) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="spy-card"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold">{skill.name}</span>
                <span className="text-xs font-mono text-spy-blue px-2 py-1 bg-spy-blue/10 rounded">
                  {skill.category}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="relative h-2 bg-spy-dark rounded-full mb-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${skill.level}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-spy-blue to-spy-accent rounded-full"
                />
              </div>
              
              {/* Percentage */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono text-gray-400">{skill.level}%</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(skill.level / 20)
                          ? 'text-spy-gold fill-spy-gold'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid md:grid-cols-3 gap-8"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-spy-blue/10 mb-4">
              <TrendingUp className="w-8 h-8 text-spy-blue" />
            </div>
            <div className="text-4xl font-bold text-spy-blue mb-2">87%</div>
            <div className="text-gray-400 font-mono text-sm">Overall Rating</div>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-spy-accent/10 mb-4">
              <Award className="w-8 h-8 text-spy-accent" />
            </div>
            <div className="text-4xl font-bold text-spy-accent mb-2">12</div>
            <div className="text-gray-400 font-mono text-sm">Missions Completed</div>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-spy-gold/10 mb-4">
              <Star className="w-8 h-8 text-spy-gold" />
            </div>
            <div className="text-4xl font-bold text-spy-gold mb-2">5</div>
            <div className="text-gray-400 font-mono text-sm">Expert Badges</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
