import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useLikes } from '@/hooks/useLikes'
import { interactionsApi } from '@/api/interactions'
import { feedApi } from '@/api/feed'
import { reportsApi } from '@/api/reports'
import { useQueryClient } from '@tanstack/react-query'
import { useUiStore } from '@/store/uiStore'
import { useDismissedLikesStore } from '@/store/dismissedLikesStore'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { PageTransition } from '@/components/ui/PageTransition'
import { HeartIcon, XIcon, TriangleAlertIcon } from '@/components/ui/Icons'
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
  const likeOpacity = useTransform(x, [0, 60, 150], [0, 0.4, 0.9])
  const dislikeOpacity = useTransform(x, [-150, -60, 0], [0.9, 0.4, 0])

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
      className="absolute w-full"
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
        scale: 1 - stackIndex * 0.03,
        opacity: 1,
        y: stackIndex * 8,
      }}
      transition={{ type: 'spring', stiffness: 600, damping: 40 }}
    >
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden relative">
        <div className="bg-neutral-100 relative" style={{ height: 'calc(100dvh - 260px)', minHeight: 280 }}>
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Avatar name={user.name} size="xl" />
            </div>
          )}
          {isTop && (
            <button
              onClick={(e) => { e.stopPropagation(); onReport() }}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center cursor-pointer hover:bg-black/50 transition-colors z-10"
            >
              <TriangleAlertIcon className="w-4 h-4" />
            </button>
          )}

          <div className="absolute inset-x-0 bottom-0 z-[5]">
            <div
              className="px-4 pt-10 pb-4"
              style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.95) 60%, rgba(255,255,255,0) 100%)' }}
            >
              <h3 className="font-bold text-lg text-neutral-900">
                {user.name}, {user.age} лет
              </h3>
              {user.city && (
                <p className="text-sm text-neutral-500 mt-0.5">{user.city}</p>
              )}
              {isTop && (
                <div className="flex justify-center items-center gap-4 mt-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); flyOut('dislike') }}
                    className="w-14 h-14 rounded-full bg-accent-red text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                  >
                    <XIcon className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); flyOut('like') }}
                    className="w-14 h-14 rounded-full bg-accent-blue text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                  >
                    <HeartIcon className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {isTop && (
            <>
              <motion.div
                className="absolute inset-x-0 bottom-0 h-1/2 flex items-center justify-center pointer-events-none rounded-b-2xl z-[6]"
                style={{
                  opacity: likeOpacity,
                  background: 'linear-gradient(to top, rgba(66,133,244,0.55) 0%, rgba(66,133,244,0.25) 50%, transparent 100%)',
                }}
              >
                <HeartIcon className="w-14 h-14 text-white drop-shadow-lg" />
              </motion.div>
              <motion.div
                className="absolute inset-x-0 bottom-0 h-1/2 flex items-center justify-center pointer-events-none rounded-b-2xl z-[6]"
                style={{
                  opacity: dislikeOpacity,
                  background: 'linear-gradient(to top, rgba(234,67,53,0.55) 0%, rgba(234,67,53,0.25) 50%, transparent 100%)',
                }}
              >
                <XIcon className="w-14 h-14 text-white drop-shadow-lg" />
              </motion.div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function Likes() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useLikes()
  const queryClient = useQueryClient()
  const dismissed = useDismissedLikesStore((s) => s.dismissed)
  const dismissUser = useDismissedLikesStore((s) => s.dismiss)
  const [matchModal, setMatchModal] = useState<{ show: boolean; matchId: string | null; userName: string }>({
    show: false,
    matchId: null,
    userName: '',
  })
  const [reportModal, setReportModal] = useState<{ show: boolean; userId: string }>({ show: false, userId: '' })
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [hearts, setHearts] = useState<FloatingHeart[] | null>(null)
  const actionLockRef = useRef(false)

  const likers = (data?.likers || []).filter((l) => !dismissed.has(l.user_id))

  const users: User[] = likers.map((l) => ({
    id: l.user_id,
    name: l.name ?? 'Без имени',
    age: l.age ?? 0,
    avatar_url: l.avatar || undefined,
    bio: '',
    city: l.city || undefined,
  }))

  const visibleUsers = users.slice(0, 3)

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

      const user = users[0]
      if (!user) { actionLockRef.current = false; return }

      if (navigator.vibrate) navigator.vibrate(type === 'like' ? [30, 20, 50] : 40)
      if (type === 'like') spawnSingleHeart()

      dismissUser(user.id)

      Promise.all([
        interactionsApi.create(user.id, type),
        feedApi.swipe(user.id, type === 'like' ? 'like' : 'skip').catch(() => {}),
      ]).then(([res]) => {
        queryClient.invalidateQueries({ queryKey: ['likes'] })
        if (res.data.matched) {
          spawnMatchHearts()
          setMatchModal({ show: true, matchId: res.data.match_id, userName: user.name })
          queryClient.invalidateQueries({ queryKey: ['matches'] })
        }
      }).catch(() => {
        queryClient.invalidateQueries({ queryKey: ['likes'] })
        queryClient.invalidateQueries({ queryKey: ['matches'] })
      })

      setTimeout(() => { actionLockRef.current = false }, 150)
    },
    [users, dismissUser, queryClient]
  )

  const handleReport = async () => {
    const user = users[0]
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
    } catch {
      useUiStore.getState().addToast({ type: 'error', message: 'Не удалось отправить жалобу' })
    }
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="max-w-sm mx-auto px-2">
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
          <p className="text-neutral-900 font-medium mb-1">Не удалось загрузить</p>
          <p className="text-neutral-400 text-sm mb-4">Проверьте подключение</p>
          <Button variant="secondary" onClick={() => refetch()}>Повторить</Button>
        </div>
      </PageTransition>
    )
  }

  const totalFromServer = data?.likers?.length ?? 0

  if (totalFromServer === 0) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <HeartIcon className="w-8 h-8 text-brand-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Пока нет симпатий</h2>
          <p className="text-neutral-400 text-sm mb-4">Здесь появятся те, кому вы понравились</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Обновить
          </Button>
        </div>
      </PageTransition>
    )
  }

  if (users.length === 0) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <HeartIcon className="w-8 h-8 text-brand-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Вы просмотрели всех</h2>
          <p className="text-neutral-400 text-sm mb-4">Новые симпатии появятся здесь</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Обновить
          </Button>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
    <div className="max-w-sm mx-auto px-2">
      <div className="flex items-center justify-between mb-2 px-1">
        <h1 className="text-lg font-bold">Симпатии</h1>
        <span className="text-sm text-neutral-400">{users.length}</span>
      </div>

      <div className="relative" style={{ height: 'calc(100dvh - 150px)' }}>
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
