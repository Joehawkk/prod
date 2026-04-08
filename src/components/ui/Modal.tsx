import { type ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XIcon } from './Icons'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
          />
          <motion.div
            className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 z-10 max-h-[90dvh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
              mass: 0.8,
            }}
          >
            <div className={`flex items-center justify-between ${title ? 'mb-4' : 'mb-2'}`}>
              {title ? <h2 className="text-lg font-bold" id="modal-title">{title}</h2> : null}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-neutral-100 ml-auto cursor-pointer transition-all duration-200 active:scale-90"
                aria-label="Закрыть"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
