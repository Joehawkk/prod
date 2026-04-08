import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUiStore } from '@/store/uiStore'
import { Avatar } from './Avatar'
import { XIcon } from './Icons'

export function MessageNotifications() {
  const notifications = useUiStore((s) => s.messageNotifications)
  const dismiss = useUiStore((s) => s.dismissMessageNotification)
  const clearForMatch = useUiStore((s) => s.clearNotificationsForMatch)
  const navigate = useNavigate()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="bg-white rounded-2xl shadow-lg border border-neutral-100 p-3 flex items-center gap-3 cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => {
              clearForMatch(n.matchId)
              navigate(`/matches/${n.matchId}`)
            }}
          >
            <Avatar src={n.senderAvatar} name={n.senderName} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{n.senderName}</p>
              <p className="text-xs text-neutral-500 truncate">{n.text}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); dismiss(n.id) }}
              className="p-1 text-neutral-400 hover:text-neutral-600 cursor-pointer flex-shrink-0"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
