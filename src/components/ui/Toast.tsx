import { motion, AnimatePresence } from 'framer-motion'
import { useUiStore } from '@/store/uiStore'
import { XIcon } from './Icons'

const bgMap = {
  success: 'bg-accent-green text-white',
  error: 'bg-accent-red text-white',
  warning: 'bg-brand-500 text-neutral-900',
  info: 'bg-accent-blue text-white',
}

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts)
  const removeToast = useUiStore((s) => s.removeToast)

  return (
    <div className="fixed top-4 left-3 right-3 sm:left-auto sm:top-auto sm:bottom-4 sm:right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px] ${bgMap[toast.type]}`}
          >
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="cursor-pointer opacity-70 hover:opacity-100">
              <XIcon className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
