'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play, Pause, Maximize2, AlertCircle } from 'lucide-react'

interface FlipbookImageProps {
  images: string[]
  fps?: number
  autoPlay?: boolean
  className?: string
  aspectRatio?: 'square' | 'video' | 'portrait'
  showControls?: boolean
  showFrameNumber?: boolean
  onFrameChange?: (frame: number) => void
}

export default function FlipbookImage({
  images,
  fps = 12,
  autoPlay = false,
  className = '',
  aspectRatio = 'video',
  showControls = true,
  showFrameNumber = true,
  onFrameChange,
}: FlipbookImageProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [direction, setDirection] = useState(1)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const aspectRatios = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
  }

  // Animation loop
  const animate = useCallback(() => {
    setCurrentFrame((prev) => {
      const nextFrame = prev + direction
      if (nextFrame >= images.length) {
        setDirection(-1)
        return prev - 1
      }
      if (nextFrame < 0) {
        setDirection(1)
        return prev + 1
      }
      return nextFrame
    })
  }, [images.length, direction])

  // Start/stop animation
  useEffect(() => {
    if (isPlaying && images.length > 1) {
      intervalRef.current = setInterval(animate, 1000 / fps)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, fps, animate, images.length])

  // Notify frame change — stable ref avoids re-renders when parent passes inline handler
  const onFrameChangeRef = useRef(onFrameChange)
  useEffect(() => { onFrameChangeRef.current = onFrameChange }, [onFrameChange])
  useEffect(() => {
    onFrameChangeRef.current?.(currentFrame)
  }, [currentFrame])

  // Preload images — set isLoaded when at least one succeeds
  useEffect(() => {
    setIsLoaded(false)
    if (images.length === 0) return

    const loadImage = (src: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false)
        img.src = src
      })
    }

    Promise.all(images.map((src) => loadImage(src))).then((results) => {
      // Set loaded if at least one image succeeded
      if (results.some((r) => r === true)) {
        setIsLoaded(true)
      }
    })
  }, [images])

  const goToFrame = (frame: number) => {
    if (images.length === 0) return
    const clampedFrame = Math.max(0, Math.min(frame, images.length - 1))
    setCurrentFrame(clampedFrame)
  }

  const nextFrame = () => {
    setDirection(1)
    goToFrame(currentFrame + 1)
  }

  const prevFrame = () => {
    setDirection(-1)
    goToFrame(currentFrame - 1)
  }

  return (
    <div ref={containerRef} className={`relative ${aspectRatios[aspectRatio]} ${className}`}>
      {/* Comic panel border effect */}
      <div className="absolute inset-0 border-4 border-black rounded-lg z-10 pointer-events-none" />
      <div className="absolute inset-0 border-2 border-white/20 rounded-lg z-10 pointer-events-none" />

      {/* Image container */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <AnimatePresence mode="wait">
          {images.length > 0 ? (
            <motion.img
              key={currentFrame}
              src={images[currentFrame]}
              alt={`Frame ${currentFrame + 1}`}
              className="w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.05 }}
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center">
              <AlertCircle className="w-12 h-12 text-gray-500 mb-3" />
              <p className="text-gray-400 font-mono text-sm">No images provided</p>
            </div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <motion.div
              className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}

        {/* Frame counter */}
        {showFrameNumber && (
          <div className="absolute top-4 right-4 z-20">
            <div className="px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full border border-white/20">
              <span className="text-white font-mono text-sm">
                {currentFrame + 1} / {images.length}
              </span>
            </div>
          </div>
        )}

        {/* Scan line effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(transparent 50%, rgba(0, 240, 255, 0.03) 50%)',
            backgroundSize: '100% 4px',
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      {/* Controls */}
      {showControls && images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {/* Play/Pause */}
          <motion.button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 bg-black/70 backdrop-blur-sm border border-white/20 rounded-full hover:bg-black/90 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-cyan-400" />
            ) : (
              <Play className="w-5 h-5 text-cyan-400" />
            )}
          </motion.button>

          {/* Previous frame */}
          <motion.button
            onClick={prevFrame}
            className="p-2 bg-black/70 backdrop-blur-sm border border-white/20 rounded-full hover:bg-black/90 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>

          {/* Frame indicator dots */}
          <div className="flex items-center gap-1 px-3 py-2 bg-black/50 backdrop-blur-sm rounded-full">
            {images.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => goToFrame(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentFrame
                    ? 'bg-cyan-400'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>

          {/* Next frame */}
          <motion.button
            onClick={nextFrame}
            className="p-2 bg-black/70 backdrop-blur-sm border border-white/20 rounded-full hover:bg-black/90 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </motion.button>

          {/* Fullscreen */}
          <motion.button
            onClick={() => {
              const elem = document.fullscreenElement
              if (elem) {
                document.exitFullscreen()
              } else {
                containerRef.current?.requestFullscreen()
              }
            }}
            className="p-2 bg-black/70 backdrop-blur-sm border border-white/20 rounded-full hover:bg-black/90 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Maximize2 className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      )}

      {/* Speed indicator */}
      <div className="absolute top-4 left-4 z-20">
        <div className="px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full border border-white/20">
          <span className="text-white font-mono text-xs uppercase tracking-wider">
            {fps}fps
          </span>
        </div>
      </div>
    </div>
  )
}
