import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOffIcon } from './ui/Icons'

type BannerState = 'online' | 'offline' | 'reconnecting'

export function OfflineBanner() {
  const [state, setState] = useState<BannerState>(navigator.onLine ? 'online' : 'offline')
  const [dismissed, setDismissed] = useState(false)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      clearTimer()
      setDismissed(false)
      setState('reconnecting')
      reconnectTimer.current = setTimeout(() => {
        setState('online')
      }, 2000)
    }

    const handleOffline = () => {
      clearTimer()
      setDismissed(false)
      setState('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearTimer()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [clearTimer])

  const isVisible = state !== 'online' && !dismissed

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 20,
            mass: 0.8,
          }}
          className={`fixed top-0 left-0 right-0 z-[200] text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium ${
            state === 'offline' ? 'bg-accent-red' : 'bg-amber-500'
          }`}
          style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}
        >
          {state === 'offline' ? (
            <>
              <WifiOffIcon className="w-4 h-4 flex-shrink-0" />
              <span>Нет подключения к интернету</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 flex-shrink-0 animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
              </svg>
              <span>Восстановление подключения...</span>
            </>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
            style={{ marginTop: 'calc(max(0rem, (env(safe-area-inset-top) - 0.625rem) / 2))' }}
            aria-label="Закрыть"
          >
            <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
