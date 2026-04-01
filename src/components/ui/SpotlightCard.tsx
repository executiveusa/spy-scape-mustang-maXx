'use client'

import { useRef, ReactNode, MouseEvent } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

/**
 * SpotlightCard — cursor-reactive glow border (radial gradient follows mouse)
 * Uses CSS custom properties --x and --y set via JS on mousemove
 */
export default function SpotlightCard({ children, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = ref.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    card.style.setProperty('--x', `${x}px`)
    card.style.setProperty('--y', `${y}px`)
  }

  const handleMouseLeave = () => {
    const card = ref.current
    if (!card) return
    card.style.setProperty('--x', '50%')
    card.style.setProperty('--y', '50%')
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`spotlight-card relative ${className}`}
      style={{
        // CSS custom props — updated in handleMouseMove
        ['--x' as string]: '50%',
        ['--y' as string]: '50%',
      }}
    >
      {/* Glow border layer */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(200px circle at var(--x) var(--y), rgba(70,213,255,0.12), transparent 70%)',
          borderRadius: 'inherit',
        }}
        aria-hidden
      />
      {/* Border glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: 'inherit',
          background:
            'radial-gradient(200px circle at var(--x) var(--y), rgba(70,213,255,0.2), transparent 70%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1px',
        }}
        aria-hidden
      />
      {children}
    </div>
  )
}
