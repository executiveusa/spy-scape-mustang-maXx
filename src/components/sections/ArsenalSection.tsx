'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

import { publicFeatureContracts, type PublicFeatureState } from '@/lib/publicFeatureMap'

type StoryFeature = {
  label: string
  internal_name: string
  source: string
  title: string
  description: string
  status: PublicFeatureState
  evidence: string
}

type StoryPayload = {
  status: 'ok' | 'degraded'
  features: StoryFeature[]
}

const fallbackFeatures: StoryFeature[] = publicFeatureContracts.map(({ Icon: _Icon, ...feature }) => ({
  ...feature,
  status: 'degraded',
  evidence: 'Runtime story state is loading from the MAXX control plane.',
}))

function statusLabel(status: PublicFeatureState) {
  if (status === 'live') return 'BACKED'
  if (status === 'standby') return 'STANDBY'
  return 'DEGRADED'
}

export default function ArsenalSection() {
  const [story, setStory] = useState<StoryPayload>({
    status: 'degraded',
    features: fallbackFeatures,
  })

  useEffect(() => {
    let cancelled = false

    async function loadStory() {
      try {
        const response = await fetch('/api/smart-site-story/', { cache: 'no-store' })
        const payload = (await response.json()) as StoryPayload
        if (!cancelled && Array.isArray(payload.features)) {
          setStory(payload)
        }
      } catch {
        if (!cancelled) {
          setStory({ status: 'degraded', features: fallbackFeatures })
        }
      }
    }

    loadStory()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section id="arsenal" className="relative py-28 bg-maxx-dark">
      <div className="section-container px-5 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-maxx-cyan font-mono text-xs tracking-[0.3em] mb-3">
            // SECTION 02
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            Q Branch: Live Capabilities
          </h2>
          <div className="w-16 h-px bg-maxx-cyan/40 mb-8" />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start mb-10">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-gray-300 text-base leading-relaxed mb-6">
              The 006 names are now field labels for real Agent MAXX control-plane
              capabilities. The frontend stays cinematic, but each claim below maps to a
              backend contract: workflow packs, operator oversight, tenant manifest data,
              Lead Desk routing, and degraded-state guardrails.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed">
              MAXX is a wrapper around Hermes for this use case: one branded smart site,
              one tenant-scoped Hermes profile, and one sellable Lead Desk employee that can
              capture, qualify, route, and summarize inbound inquiries today.
            </p>
          </motion.div>

          <motion.div
            className="relative aspect-video bg-maxx-panel border border-maxx-border overflow-hidden"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src="/mustang-maxx-images/ChatGPT%20Image%20May%2012,%202025,%2012_07_22%20AM.png"
              alt="Agent MAXX control plane briefing"
              fill
              className="object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-maxx-black via-maxx-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-[10px] font-mono text-maxx-cyan tracking-wider bg-maxx-black/70 px-2 py-1">
                STORY MAP STATUS: {story.status.toUpperCase()}
              </span>
              <p className="mt-3 max-w-md text-xs leading-5 text-white/75">
                Public storytelling is hydrated through a sanitized control-plane endpoint,
                not raw operator data.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative">
        <motion.div
          className="section-container px-5 mb-4 flex items-center gap-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="h-px flex-1 bg-maxx-border" />
          <span className="text-[10px] font-mono text-gray-600 tracking-[0.3em]">RUNTIME-BACKED FEATURE MAP</span>
          <div className="h-px flex-1 bg-maxx-border" />
        </motion.div>

        <div
          className="flex gap-4 overflow-x-auto pb-6 px-5 select-none"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {story.features.map((feature, index) => {
            const contract = publicFeatureContracts.find((item) => item.label === feature.label)
            const Icon = contract?.Icon
            return (
              <motion.div
                key={feature.label}
                className="flex-none w-72 md:w-80 card-noir p-5 group relative overflow-hidden"
                style={{ scrollSnapAlign: 'start' }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: Math.min(index * 0.06, 0.4), duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-maxx-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="flex items-start justify-between mb-4">
                  {Icon ? <Icon className="w-5 h-5 text-maxx-cyan group-hover:drop-shadow-[0_0_6px_rgba(70,213,255,0.8)] transition-all" /> : null}
                  <span
                    className={`text-[10px] font-mono tracking-wider px-2 py-0.5 ${
                      feature.status === 'live'
                        ? 'text-emerald-400 bg-emerald-400/10'
                        : 'text-maxx-orange bg-maxx-orange/10'
                    }`}
                  >
                    {statusLabel(feature.status)}
                  </span>
                </div>

                <p className="text-[9px] font-mono text-maxx-cyan tracking-widest mb-1 uppercase">
                  {feature.label} - {feature.source}
                </p>
                <h3 className="text-sm font-heading font-semibold text-white tracking-wider mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed mb-4">
                  {feature.description}
                </p>
                <p className="border-t border-maxx-border pt-3 text-[11px] leading-5 text-white/55">
                  {feature.evidence}
                </p>
              </motion.div>
            )
          })}
          <div className="flex-none w-5" />
        </div>
      </div>
    </section>
  )
}
