'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 350 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.3}
            onDragEnd={(_, info) => { if (info.offset.y > 120) onClose() }}
            className="fixed bottom-0 left-0 right-0 z-50 bottom-sheet safe-bottom max-h-[85vh] overflow-y-auto scroll-touch">
            <div className="bottom-sheet-handle" />
            {title && <h2 className="font-black text-lg text-white mb-4 px-1">{title}</h2>}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
