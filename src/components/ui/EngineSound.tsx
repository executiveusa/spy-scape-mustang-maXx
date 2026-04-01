'use client'

import { useEffect, useRef } from 'react'

/**
 * EngineSound — synthesizes a Mustang Eleanor V8 engine rev on site load
 * Uses Web Audio API only — no external audio file required
 * Respects prefers-reduced-motion (skips entirely if set)
 */
export default function EngineSound() {
  const playedRef = useRef(false)

  useEffect(() => {
    if (playedRef.current) return
    if (typeof window === 'undefined') return

    // Respect reduced motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    // Only autoplay after first user interaction (browser policy)
    const play = () => {
      if (playedRef.current) return
      playedRef.current = true

      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

        // --- V8 ENGINE REV SYNTHESIS ---
        const totalDuration = 3.2

        // Fundamental engine frequency — starts at idle ~28Hz, revs to 120Hz
        const engineFreq = ctx.createOscillator()
        engineFreq.type = 'sawtooth'
        engineFreq.frequency.setValueAtTime(28, ctx.currentTime)
        engineFreq.frequency.linearRampToValueAtTime(90, ctx.currentTime + 1.4)
        engineFreq.frequency.linearRampToValueAtTime(120, ctx.currentTime + 2.0)
        engineFreq.frequency.linearRampToValueAtTime(60, ctx.currentTime + 2.8)
        engineFreq.frequency.linearRampToValueAtTime(35, ctx.currentTime + 3.2)

        // 2nd harmonic — adds V8 character
        const harmonic2 = ctx.createOscillator()
        harmonic2.type = 'sawtooth'
        harmonic2.frequency.setValueAtTime(56, ctx.currentTime)
        harmonic2.frequency.linearRampToValueAtTime(180, ctx.currentTime + 1.4)
        harmonic2.frequency.linearRampToValueAtTime(240, ctx.currentTime + 2.0)
        harmonic2.frequency.linearRampToValueAtTime(120, ctx.currentTime + 2.8)
        harmonic2.frequency.linearRampToValueAtTime(70, ctx.currentTime + 3.2)

        // 3rd harmonic — rumble
        const harmonic3 = ctx.createOscillator()
        harmonic3.type = 'square'
        harmonic3.frequency.setValueAtTime(14, ctx.currentTime)
        harmonic3.frequency.linearRampToValueAtTime(46, ctx.currentTime + 1.4)
        harmonic3.frequency.linearRampToValueAtTime(60, ctx.currentTime + 2.0)
        harmonic3.frequency.linearRampToValueAtTime(30, ctx.currentTime + 2.8)
        harmonic3.frequency.linearRampToValueAtTime(18, ctx.currentTime + 3.2)

        // Noise layer — exhaust crackle
        const bufferSize = ctx.sampleRate * totalDuration
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const data = noiseBuffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1
        }
        const noise = ctx.createBufferSource()
        noise.buffer = noiseBuffer

        // Filter for exhaust crackle — bandpass around 180-400Hz
        const crackleFilter = ctx.createBiquadFilter()
        crackleFilter.type = 'bandpass'
        crackleFilter.frequency.setValueAtTime(200, ctx.currentTime)
        crackleFilter.frequency.linearRampToValueAtTime(400, ctx.currentTime + 2.0)
        crackleFilter.Q.value = 2

        // Lowpass filter — shapes overall tone
        const lowpass = ctx.createBiquadFilter()
        lowpass.type = 'lowpass'
        lowpass.frequency.setValueAtTime(300, ctx.currentTime)
        lowpass.frequency.linearRampToValueAtTime(900, ctx.currentTime + 2.0)
        lowpass.frequency.linearRampToValueAtTime(400, ctx.currentTime + 3.2)

        // Master gain envelope
        const masterGain = ctx.createGain()
        masterGain.gain.setValueAtTime(0, ctx.currentTime)
        masterGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.15)
        masterGain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 1.4)
        masterGain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 2.0)
        masterGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2.8)
        masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + totalDuration)

        // Individual gains
        const g1 = ctx.createGain(); g1.gain.value = 0.5
        const g2 = ctx.createGain(); g2.gain.value = 0.35
        const g3 = ctx.createGain(); g3.gain.value = 0.4
        const gNoise = ctx.createGain(); gNoise.gain.value = 0.15

        // Connect graph
        engineFreq.connect(g1).connect(lowpass)
        harmonic2.connect(g2).connect(lowpass)
        harmonic3.connect(g3).connect(lowpass)
        noise.connect(crackleFilter).connect(gNoise).connect(lowpass)
        lowpass.connect(masterGain).connect(ctx.destination)

        // Start all sources
        engineFreq.start(ctx.currentTime)
        harmonic2.start(ctx.currentTime)
        harmonic3.start(ctx.currentTime)
        noise.start(ctx.currentTime)

        // Stop all after totalDuration
        engineFreq.stop(ctx.currentTime + totalDuration)
        harmonic2.stop(ctx.currentTime + totalDuration)
        harmonic3.stop(ctx.currentTime + totalDuration)
        noise.stop(ctx.currentTime + totalDuration)

        // Cleanup context after sound finishes
        setTimeout(() => ctx.close(), (totalDuration + 0.5) * 1000)
      } catch {
        // Audio synthesis failed silently — non-critical feature
      }
    }

    // Trigger on first click, touch, or keypress
    const events = ['click', 'touchstart', 'keydown'] as const
    events.forEach((e) => window.addEventListener(e, play, { once: true }))

    return () => {
      events.forEach((e) => window.removeEventListener(e, play))
    }
  }, [])

  return null // No UI — audio only
}
