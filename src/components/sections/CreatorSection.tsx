'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function CreatorSection() {
  return (
    <section id="creator" className="relative py-28 px-5">
      <div className="section-container">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-maxx-cyan font-mono text-xs tracking-[0.3em] mb-3">
            // SECTION 04
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            The Creator&apos;s Den
          </h2>
          <div className="w-16 h-px bg-maxx-cyan/40" />
        </motion.div>

        {/* Two-column editorial */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-gray-300 text-base leading-relaxed mb-6">
              The founder and creative director of MACS Digital Media has worked on seven
              of the earliest Yappyverse chapters and was responsible for some of the most
              memorable and boundary-pushing digital campaigns and character experiences
              of the 21st century.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed mb-5">
              As creative director of Chapter One, it was MACS who first visualised
              the Mustang MAXX with digital upgrades, drawing on his experience as a
              street entrepreneur and his enduring love of American muscle cars.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed">
              Fans of his work will have seen his process in action — working from reference
              materials, concept sketches and mood boards with a precision that reflects his
              approach to every campaign. The photographs and files in this section show an
              environment which reflects this creative process alongside some of his most
              striking and original character designs.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-gray-500 text-sm leading-relaxed mb-5">
              MACS became known for his cinematic, street-forward and large-scale creative
              vision, transporting audiences into a world which was larger than life. His
              signature campaigns include the founding of the Yappyverse digital universe,
              the Mustang MAXX character franchise and the MACS Digital Media agency brand
              built for a new generation of digital entrepreneurs.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed">
              MACS designed the modifications for the Mustang MAXX first seen in Chapter One.
              Several of the upgrades he put into the car were inspired by future-facing
              technology — including AI neural targeting and encrypted communications.
              Others, such as the drone swarm system and the cloaking layer, were inspired
              by his love of science fiction and his vision of what the car of 2056 would
              need to carry.
            </p>
          </motion.div>
        </div>

        {/* Image gallery — 3-column */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { src: '/mustang-maxx-images/ChatGPT%20Image%20May%209,%202025,%2011_08_35%20PM.png', caption: 'AGENT 006 — FOUNDING CHARACTER DESIGN' },
            { src: '/mustang-maxx-images/ChatGPT%20Image%20May%2012,%202025,%2012_08_54%20AM.png', caption: 'ELEANOR 2056 — CONCEPT REFERENCE' },
            { src: '/mustang-maxx-images/ChatGPT%20Image%20May%2012,%202025,%2012_07_22%20AM.png', caption: 'CHAPTER ONE — CITY PURSUIT' },
          ].map((img, i) => (
            <motion.div
              key={img.caption}
              className="relative aspect-[4/3] bg-maxx-panel border border-maxx-border overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Image
                src={img.src}
                alt={img.caption}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-maxx-black/80 via-transparent to-transparent" />
              <p className="absolute bottom-3 left-3 right-3 text-[9px] font-mono text-gray-400 tracking-wider">
                {img.caption}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
