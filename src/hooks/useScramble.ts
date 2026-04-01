'use client'

import { useEffect, useRef, useState } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*/<>[]'

/**
 * useScramble — matrix-style text decode effect
 * Returns the current display text and a `trigger()` function to restart
 */
export function useScramble(finalText: string, duration = 900) {
  const [display, setDisplay] = useState(finalText)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number | null>(null)

  const trigger = () => {
    startRef.current = null
    const len = finalText.length

    const frame = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      let result = ''
      for (let i = 0; i < len; i++) {
        if (finalText[i] === ' ') { result += ' '; continue }
        const threshold = (i / len) * 0.65 + 0.1
        if (progress >= threshold) {
          result += finalText[i]
        } else {
          result += CHARS[Math.floor(Math.random() * CHARS.length)]
        }
      }
      setDisplay(result)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        setDisplay(finalText)
      }
    }

    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(frame)
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  return { display, trigger }
}
