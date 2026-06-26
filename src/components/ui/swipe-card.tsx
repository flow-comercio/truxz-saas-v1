'use client'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useState } from 'react'
import { Check, X } from 'lucide-react'

interface SwipeCardProps {
  children: React.ReactNode
  onSwipeRight?: () => void
  onSwipeLeft?: () => void
  rightLabel?: string
  leftLabel?: string
}

export function SwipeCard({
  children, onSwipeRight, onSwipeLeft,
  rightLabel = 'Concluir', leftLabel = 'Cancelar',
}: SwipeCardProps) {
  const x = useMotionValue(0)
  const bgRight = useTransform(x, [0, 100], [0, 1])
  const bgLeft  = useTransform(x, [-100, 0], [1, 0])

  return (
    <div className="relative overflow-hidden rounded-[20px]">
      {onSwipeRight && (
        <motion.div className="absolute inset-0 flex items-center pl-5 rounded-[20px]"
          style={{ background: 'rgba(52,199,89,0.15)', opacity: bgRight }}>
          <div className="flex items-center gap-2 text-[#34C759] font-black text-sm">
            <Check className="w-5 h-5" /> {rightLabel}
          </div>
        </motion.div>
      )}
      {onSwipeLeft && (
        <motion.div className="absolute inset-0 flex items-center justify-end pr-5 rounded-[20px]"
          style={{ background: 'rgba(255,55,95,0.15)', opacity: bgLeft }}>
          <div className="flex items-center gap-2 text-[#FF375F] font-black text-sm">
            {leftLabel} <X className="w-5 h-5" />
          </div>
        </motion.div>
      )}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 100 && onSwipeRight) onSwipeRight()
          else if (info.offset.x < -100 && onSwipeLeft) onSwipeLeft()
          animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
        }}
        className="card relative z-10"
        whileTap={{ cursor: 'grabbing' }}>
        {children}
      </motion.div>
    </div>
  )
}
