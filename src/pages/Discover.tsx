import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion'
import { useRecommendations } from '@/hooks/useRecommendations'
import { interactionsApi } from '@/api/interactions'
import { feedApi } from '@/api/feed'
import { reportsApi } from '@/api/reports'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { PageTransition } from '@/components/ui/PageTransition'
import { HeartIcon, XIcon, TriangleAlertIcon, SearchIcon } from '@/components/ui/Icons'
import type { User } from '@/types'

interface FloatingHeart {
  id: number
  x: number
  y: number
  size: number
  delay: number
}

function HeartBurst({ hearts, onDone }: { hearts: FloatingHeart[]; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1200)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          className="absolute text-accent-blue"
          style={{ left: h.x, top: h.y, fontSize: h.size }}
          initial={{ opacity: 0.7, scale: 0, y: 0 }}
          animate={{
            opacity: 0,
            scale: 1,
            y: -200 - Math.random() * 150,
            x: (Math.random() - 0.5) * 200,
          }}
          transition={{ duration: 0.9 + Math.random() * 0.4, delay: h.delay, ease: 'easeOut' }}
        >
          &#x2764;
        </motion.div>
      ))}
    </div>
  )
}

function SwipeCard({
  user,
  onSwipe,
  onReport,
  isTop,
  stackIndex,
}: {
  user: User
  onSwipe: (dir: 'like' | 'dislike') => void
  onReport: () => void
  isTop: boolean
  stackIndex: number
}) {
  const x = useMotionValue(0)
  const swiping = useRef(false)
  const rotate = useTransform(x, [-200, 200], [-12, 12])
  const likeOpacity = useTransform(x, [0, 40, 120], [0, 0.5, 1])
  const dislikeOpacity = useTransform(x, [-120, -40, 0], [1, 0.5, 0])

  const flyOut = useCallback((dir: 'like' | 'dislike') => {
    if (swiping.current) return
    swiping.current = true
    let called = false
    const done = () => { if (called) return; called = true; onSwipe(dir) }
    const target = dir === 'like' ? 500 : -500
    animate(x, target, { type: 'tween', duration: 0.18, ease: 'easeOut', onComplete: done })
    setTimeout(done, 220) // safety net if onComplete doesn't fire
  }, [x, onSwipe])

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (swiping.current) return
    const threshold = 60
    const vThreshold = 300
    if (info.offset.x > threshold || info.velocity.x > vThreshold) {
      flyOut('like')
    } else if (info.offset.x < -threshold || info.velocity.x < -vThreshold) {
      flyOut('dislike')
    } else {
      animate(x, 0, { type: 'spring', stiffness: 600, damping: 30 })
    }
  }

  return (
    <motion.div
      className="absolute w-full origin-center"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        zIndex: 3 - stackIndex,
        willChange: 'transform',
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: -300, right: 300 }}
      dragElastic={0.15}
      onDragEnd={isTop ? handleDragEnd : undefined}
      initial={false}
      animate={{
        scale: 1 - stackIndex * 0.05,
        y: stackIndex * 12,
        opacity: stackIndex > 1 ? 0.6 : 1,
      }}
      transition={{ type: 'spring', stiffness: 600, damping: 40 }}
    >
      <div className="rounded-3xl overflow-hidden relative flex flex-col bg-white border border-neutral-200 shadow-xl">
        <div className="p-3 pb-0">
          <div className="relative w-full rounded-2xl overflow-hidden" style={{ paddingBottom: '100%' }}>
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                <Avatar name={user.name} size="xl" />
              </div>
            )}

            {isTop && (
              <button
                onClick={(e) => { e.stopPropagation(); onReport() }}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm text-white/80 flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors z-10"
              >
                <TriangleAlertIcon className="w-4 h-4" />
              </button>
            )}

            <div
              className="absolute inset-x-0 bottom-0 px-4 pt-12 pb-3 rounded-b-2xl"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }}
            >
              <h3 className="font-bold text-xl text-white drop-shadow-sm">
                {user.name}, {user.age}
              </h3>
            </div>

            {isTop && (
              <>
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-2xl z-[6]"
                  style={{
                    opacity: likeOpacity,
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.6) 0%, rgba(59,130,246,0.3) 100%)',
                  }}
                >
                  <div className="w-28 h-28 rounded-full bg-blue-500/40 backdrop-blur-md flex items-center justify-center border-2 border-white/40">
                    <HeartIcon className="w-14 h-14 text-white drop-shadow-xl" />
                  </div>
                </motion.div>
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-2xl z-[6]"
                  style={{
                    opacity: dislikeOpacity,
                    background: 'linear-gradient(225deg, rgba(239,68,68,0.6) 0%, rgba(239,68,68,0.3) 100%)',
                  }}
                >
                  <div className="w-28 h-28 rounded-full bg-red-500/40 backdrop-blur-md flex items-center justify-center border-2 border-white/40">
                    <XIcon className="w-14 h-14 text-white drop-shadow-xl" />
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-neutral-500 text-center mb-4">
            {user.match_tags && user.match_tags.length > 0
              ? user.match_tags.slice(0, 3).join(' · ')
              : user.score != null
                ? 'Есть общие интересы'
                : 'Возможно, вам понравится'}
          </p>

          <div className="flex justify-center items-center gap-5">
            <button
              onClick={(e) => { e.stopPropagation(); flyOut('dislike') }}
              className="w-16 h-16 rounded-full bg-red-500/80 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform cursor-pointer"
              disabled={!isTop}
            >
              <XIcon className="w-7 h-7" />
            </button>

            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-emerald-500">
                {user.score != null ? Math.round(user.score * 100) : '—'}%
              </span>
              <span className="text-[10px] text-emerald-400 -mt-0.5 font-medium">совпадение</span>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); flyOut('like') }}
              className="w-16 h-16 rounded-full bg-blue-500/80 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform cursor-pointer"
              disabled={!isTop}
            >
              <HeartIcon className="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const TIP_SHOWN_KEY = 'tmatch_tip_shown'

export default function Discover() {
  const navigate = useNavigate()
  const { data: recommendations, isLoading, isError, refetch } = useRecommendations()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [matchModal, setMatchModal] = useState<{ show: boolean; matchId: string | null; userName: string }>({
    show: false,
    matchId: null,
    userName: '',
  })
  const [reportModal, setReportModal] = useState<{ show: boolean; userId: string }>({ show: false, userId: '' })
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [showTip, setShowTip] = useState(() => !localStorage.getItem(TIP_SHOWN_KEY))
  const [hearts, setHearts] = useState<FloatingHeart[] | null>(null)
  const actionLockRef = useRef(false)

  const dismissTip = () => {
    setShowTip(false)
    localStorage.setItem(TIP_SHOWN_KEY, '1')
  }

  useEffect(() => {
    if (!showTip) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowTip(false)
        localStorage.setItem(TIP_SHOWN_KEY, '1')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showTip])

  const users = recommendations || []
  const visibleUsers = users.slice(currentIndex, currentIndex + 3)

  const spawnSingleHeart = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    const batch: FloatingHeart[] = Array.from({ length: 25 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * w,
      y: Math.random() * h,
      size: 48 + Math.random() * 72,
      delay: Math.random() * 0.25,
    }))
    setHearts(batch)
  }

  const spawnMatchHearts = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    const batch: FloatingHeart[] = Array.from({ length: 120 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * w,
      y: Math.random() * h,
      size: 32 + Math.random() * 80,
      delay: Math.random() * 0.7,
    }))
    setHearts(batch)
  }

  const handleSwipeComplete = useCallback(
    (type: 'like' | 'dislike') => {
      if (actionLockRef.current) return
      actionLockRef.current = true

      const user = users[currentIndex]
      if (!user) { actionLockRef.current = false; return }

      if (navigator.vibrate) navigator.vibrate(type === 'like' ? [30, 20, 50] : 40)
      if (type === 'like') spawnSingleHeart()

      setCurrentIndex((i) => i + 1)

      Promise.all([
        interactionsApi.create(user.id, type),
        feedApi.swipe(user.id, type === 'like' ? 'like' : 'skip').catch(() => {}),
      ]).then(([res]) => {
        if (res.data.matched) {
          spawnMatchHearts()
          setMatchModal({ show: true, matchId: res.data.match_id, userName: user.name })
        }
      }).catch(() => {})

      if (showTip) dismissTip()

      setTimeout(() => { actionLockRef.current = false }, 150)
    },
    [users, currentIndex, showTip]
  )

  const handleReport = async () => {
    const user = users[currentIndex]
    if (!user || !reportReason) return

    try {
      const reasonMap: Record<string, string> = {
        'Неприемлемый контент': 'inappropriate_content',
        'Фейк': 'scam',
      }
      await reportsApi.create(user.id, reasonMap[reportReason] || 'other', reportDetails || undefined)
      useUiStore.getState().addToast({ type: 'success', message: 'Жалоба успешно отправлена' })
      setReportModal({ show: false, userId: '' })
      setReportReason('')
      setReportDetails('')
      handleSwipeComplete('dislike')
    } catch {
      useUiStore.getState().addToast({ type: 'error', message: 'Не удалось отправить жалобу' })
    }
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto px-3">
          <CardSkeleton />
        </div>
      </PageTransition>
    )
  }

  if (isError) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-accent-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <TriangleAlertIcon className="w-7 h-7 text-accent-red" />
          </div>
          <p className="text-neutral-900 font-medium mb-1">Не удалось загрузить ленту</p>
          <p className="text-neutral-400 text-sm mb-4">Проверьте подключение и попробуйте снова</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Повторить
          </Button>
        </div>
      </PageTransition>
    )
  }

  if (users.length === 0 || currentIndex >= users.length) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <SearchIcon className="w-8 h-8 text-brand-500" />
          </div>
          <p className="text-neutral-900 font-medium mb-1">Все просмотрены!</p>
          <p className="text-neutral-400 text-sm mb-4">Возвращайся позже за новыми рекомендациями</p>
          <Button variant="secondary" onClick={() => { setCurrentIndex(0); refetch() }}>
            Обновить
          </Button>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
    <div className="max-w-md mx-auto px-3">
      <div className="relative" style={{ minHeight: 'calc(100dvh - 140px)' }}>
        {visibleUsers.map((user, i) => (
          <SwipeCard
            key={user.id}
            user={user}
            isTop={i === 0}
            stackIndex={i}
            onSwipe={handleSwipeComplete}
            onReport={() => setReportModal({ show: true, userId: user.id })}
          />
        ))}

        {showTip && visibleUsers.length > 0 && (
          <motion.div
            className="absolute inset-0 z-10 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={dismissTip}
          >
            <div className="bg-white/95 rounded-2xl p-6 shadow-lg mx-4 cursor-pointer" onClick={dismissTip}>
              <h3 className="font-bold text-lg mb-3">Как пользоваться?</h3>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li>Для лайка смахните вправо / нажмите лайк</li>
                <li>Для дизлайка смахните влево / нажмите дизлайк</li>
              </ul>
            </div>
          </motion.div>
        )}
      </div>

      {hearts && <HeartBurst hearts={hearts} onDone={() => setHearts(null)} />}

      <Modal
        open={matchModal.show}
        onClose={() => setMatchModal({ show: false, matchId: null, userName: '' })}
        title="Это мэтч!"
      >
        <div className="text-center py-4">
          <p className="text-lg mb-4">Вы понравились друг другу с <strong>{matchModal.userName}</strong>!</p>
          <Button
            fullWidth
            onClick={() => {
              setMatchModal({ show: false, matchId: null, userName: '' })
              if (matchModal.matchId) navigate(`/matches/${matchModal.matchId}`)
            }}
          >
            Написать
          </Button>
        </div>
      </Modal>

      <Modal
        open={reportModal.show}
        onClose={() => { setReportModal({ show: false, userId: '' }); setReportReason(''); setReportDetails('') }}
        title="Отправьте жалобу"
      >
        <div className="space-y-3">
          {['Неприемлемый контент', 'Фейк'].map((reason) => (
            <label
              key={reason}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                ${reportReason === reason ? 'border-accent-blue bg-blue-50' : 'border-neutral-200'}`}
            >
              <input
                type="radio"
                name="report_reason"
                checked={reportReason === reason}
                onChange={() => setReportReason(reason)}
                className="accent-accent-blue"
              />
              <span className="text-sm">{reason}</span>
            </label>
          ))}
          <textarea
            placeholder="Дополнительные детали..."
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            className="w-full px-4 py-3 text-sm bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-accent-blue resize-none h-20"
          />
          <Button fullWidth onClick={handleReport} disabled={!reportReason}>
            Отправить
          </Button>
        </div>
      </Modal>
    </div>
    </PageTransition>
  )
}
