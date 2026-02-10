'use client';

import { motion } from 'framer-motion';
import Hero from '@/components/Hero';
import Mission from '@/components/Mission';
import Training from '@/components/Training';
import Skills from '@/components/Skills';
import Gadgets from '@/components/Gadgets';
import PhotoBooth from '@/components/PhotoBooth';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Mission Statement */}
      <Mission />

      {/* Training Programs */}
      <Training />

      {/* Skills Assessment */}
      <Skills />

      {/* Gadgets Display */}
      <Gadgets />

      {/* Photo Booth */}
      <PhotoBooth />

      {/* Footer */}
      <Footer />
    </main>
  );
}
