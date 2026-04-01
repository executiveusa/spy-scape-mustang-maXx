'use client'

import { useRef, useEffect } from 'react'

interface Props {
  text?: string
  speed?: number
  className?: string
}

/**
 * KineticMarquee — continuous scrolling ticker that accelerates with scroll velocity
 * Pure CSS transform, 60fps via requestAnimationFrame
 */
export default function KineticMarquee({
  text = 'AGENT 006 • MACS DIGITAL MEDIA • YAPPYVERSE • CLASSIFIED • EYES ONLY •',
  speed = 55,
  className = '',
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const xRef = useRef(0)
  const rafRef = useRef<number>(0)
  const lastScrollY = useRef(0)
  const velocityBoost = useRef(1)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const item = track.querySelector<HTMLSpanElement>('[data-item]')
    if (!item) return
    const itemW = item.offsetWidth

    const handleScroll = () => {
      const delta = Math.abs(window.scrollY - lastScrollY.current)
      velocityBoost.current = 1 + Math.min(delta * 0.08, 3)
      lastScrollY.current = window.scrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    const tick = () => {
      xRef.current -= (speed * velocityBoost.current) / 60
      // Reset when one full item has passed — seamless loop
      if (Math.abs(xRef.current) >= itemW) xRef.current = 0
      if (track) track.style.transform = `translateX(${xRef.current}px)`

      // Decay velocity boost back to 1x
      velocityBoost.current = Math.max(1, velocityBoost.current - 0.05)

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [speed])

  // Duplicate text enough to fill any viewport
  const content = `${text}   `

  return (
    <div className={`overflow-hidden border-y border-maxx-border/40 py-[10px] bg-maxx-black ${className}`}>
      <div
        ref={trackRef}
        className="flex whitespace-nowrap will-change-transform"
      >
        {/* Three copies ensures seamless loop at any viewport size */}
        <span data-item className="text-[10px] font-mono tracking-[0.3em] text-maxx-cyan/40 uppercase pr-0">
          {content}
        </span>
        <span className="text-[10px] font-mono tracking-[0.3em] text-maxx-cyan/40 uppercase pr-0">
          {content}
        </span>
        <span className="text-[10px] font-mono tracking-[0.3em] text-maxx-cyan/40 uppercase pr-0">
          {content}
        </span>
      </div>
    </div>
  )
}
