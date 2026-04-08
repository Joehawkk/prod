import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, useMotionValue } from 'framer-motion'
import { useMessages, useSendMessage, useSendImage, useMarkRead, useProposeMeeting, useMatches } from '@/hooks/useMatches'
import { sendWsMessage, sendWsTyping, sendWsRead, onTyping } from '@/hooks/useWebSocket'
import { reportsApi } from '@/api/reports'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  ArrowLeftIcon, TriangleAlertIcon, CalendarIcon,
  ClockIcon, MapPinIcon, SendIcon, PaperclipIcon, MessageCircleIcon,
} from '@/components/ui/Icons'
import type { Message } from '@/types'

function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN)
  const normalized = (dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr))
    ? dateStr
    : dateStr + 'Z'
  return new Date(normalized)
}

function formatMessageTime(dateStr: string) {
  try {
    const d = parseDate(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function shouldShowDateSeparator(current: string, prev?: string) {
  if (!prev) return true
  const a = parseDate(current).toLocaleDateString('ru-RU')
  const b = parseDate(prev).toLocaleDateString('ru-RU')
  return a !== b
}

function formatDateSeparator(dateStr: string) {
  const d = parseDate(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000 && d.getDate() === now.getDate()) return 'Сегодня'
  if (diff < 172800000) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const isImage = message.message_type === 'image'
  const time = formatMessageTime(message.created_at)

  return (
    <motion.div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {isImage ? (
        <div className={`relative max-w-[75%] ${isOwn ? 'rounded-br-md' : 'rounded-bl-md'}`}>
          <img
            src={message.content}
            alt="Фото"
            className={`rounded-2xl object-cover ${isOwn ? 'rounded-br-md' : 'rounded-bl-md'}`}
            style={{ maxHeight: 300 }}
          />
          {time && (
            <span className="absolute bottom-2 right-2 text-[10px] text-white bg-black/40 rounded-full px-1.5 py-0.5">
              {time}
            </span>
          )}
        </div>
      ) : (
        <div
          className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm
            ${isOwn
              ? 'bg-blue-100 text-neutral-900 rounded-br-md'
              : 'bg-neutral-100 text-neutral-900 rounded-bl-md'
            }`}
        >
          <span>{message.content}</span>
          {time && (
            <span className={`text-[10px] ml-2 align-bottom ${isOwn ? 'text-blue-400' : 'text-neutral-400'}`}>
              {time}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}

function MeetingCard({ meeting }: { meeting: { date: string; time: string; location: string; description?: string } }) {
  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 my-2 max-w-[85%]">
      <h4 className="font-bold text-sm mb-3">Вы назначили свидание!</h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-neutral-600">
          <CalendarIcon className="w-4 h-4" />
          <span>Дата встречи: {new Date(meeting.date).toLocaleDateString('ru-RU')}</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-600">
          <ClockIcon className="w-4 h-4" />
          <span>Время встречи: {meeting.time}</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-600">
          <MapPinIcon className="w-4 h-4" />
          <span>Место встречи: {meeting.location}</span>
        </div>
        {meeting.description && (
          <p className="text-neutral-400">Описание: {meeting.description}</p>
        )}
      </div>
    </div>
  )
}

export default function Chat() {
  const { id: matchId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const lastTypingSent = useRef(0)

  const token = useAuthStore((s) => s.token)
  const currentUserId = token ? (() => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.sub || payload.user_id || 'current'
    } catch {
      return 'current'
    }
  })() : 'current'

  const { data: matches } = useMatches()
  const match = matches?.find((m) => m.id === matchId)
  const { data: messages, isLoading, isError: messagesError, refetch: refetchMessages } = useMessages(matchId || '')
  const sendMessage = useSendMessage(matchId || '')
  const sendImage = useSendImage(matchId || '')
  const markRead = useMarkRead(matchId || '')
  const proposeMeeting = useProposeMeeting(matchId || '')

  const [text, setText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [profileModal, setProfileModal] = useState(false)
  const [meetingModal, setMeetingModal] = useState(false)
  const [reportModal, setReportModal] = useState(false)
  const [meetingForm, setMeetingForm] = useState({ date: '', time: '', location: '', description: '' })
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')

  useEffect(() => {
    if (!matchId) return
    return onTyping((mid, uid) => {
      if (mid === matchId && uid !== currentUserId) {
        setIsTyping(true)
        clearTimeout(typingTimeout.current)
        typingTimeout.current = setTimeout(() => setIsTyping(false), 3000)
      }
    })
  }, [matchId, currentUserId])

  const swipeX = useMotionValue(0)
  const handleSwipeEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (info.offset.x > 100 || info.velocity.x > 500) {
      navigate('/matches')
    }
  }

  const isOwnMessage = (msg: Message) =>
    msg.sender_id === currentUserId || msg.sender_id === 'current'

  useEffect(() => {
    if (matchId) {
      markRead.mutate()
      sendWsRead(matchId)
      useUiStore.getState().clearNotificationsForMatch(matchId)
    }
  }, [matchId])

  useEffect(() => {
    if (matchId && messages && messages.length > 0) {
      const hasUnread = messages.some(m => !isOwnMessage(m))
      if (hasUnread) {
        markRead.mutate()
        sendWsRead(matchId)
        useUiStore.getState().clearNotificationsForMatch(matchId)
      }
    }
  }, [messages?.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim()) return
    const content = text.trim()
    setText('')
    await sendMessage.mutateAsync(content)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      useUiStore.getState().addToast({ type: 'error', message: 'Файл слишком большой (макс. 5 МБ)' })
      return
    }
    await sendImage.mutateAsync(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleProposeMeeting = async () => {
    if (!meetingForm.date || !meetingForm.time || !meetingForm.location) return
    await proposeMeeting.mutateAsync({
      date: meetingForm.date,
      time: meetingForm.time,
      location: meetingForm.location,
      description: meetingForm.description || undefined,
    })
    setMeetingModal(false)
    setMeetingForm({ date: '', time: '', location: '', description: '' })
  }

  const handleReport = async () => {
    if (!match || !reportReason) return
    try {
      const reasonMap: Record<string, string> = {
        'Неприемлемый контент': 'inappropriate_content',
        'Токсичное общение': 'toxic',
        'Спам': 'scam',
        'Фейк': 'scam',
        'Угрозы': 'threats',
      }
      await reportsApi.create(match.user.id, reasonMap[reportReason] || 'other', reportDetails || undefined)
      useUiStore.getState().addToast({ type: 'success', message: 'Жалоба отправлена' })
      setReportModal(false)
      setReportReason('')
      setReportDetails('')
    } catch {
      useUiStore.getState().addToast({ type: 'error', message: 'Ошибка отправки' })
    }
  }

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-sm flex flex-col h-[calc(100dvh-120px)] md:h-[calc(100dvh-72px)]"
      style={{ x: swipeX }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.4 }}
      onDragEnd={handleSwipeEnd}
      dragDirectionLock
    >

      <div className="flex items-center gap-3 p-4 border-b border-neutral-100">
        <button onClick={() => navigate('/matches')} className="cursor-pointer hover:text-neutral-600">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold flex-shrink-0">Чат</h1>
      </div>

      {match && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
          <button onClick={() => setProfileModal(true)} className="cursor-pointer">
            <Avatar src={match.user.avatar_url} name={match.user.name} size="sm" />
          </button>
          <button onClick={() => setProfileModal(true)} className="font-medium flex-1 text-left cursor-pointer hover:text-neutral-600">
            {match.user.name}
          </button>
          <button
            onClick={() => setReportModal(true)}
            className="text-accent-orange hover:opacity-80 cursor-pointer"
          >
            <TriangleAlertIcon className="w-5 h-5" />
          </button>
        </div>
      )}


      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                <Skeleton className="w-48 h-10 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messagesError ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full gap-3">
            <p className="text-neutral-400 text-sm">Не удалось загрузить сообщения</p>
            <Button variant="secondary" size="sm" onClick={() => refetchMessages()}>
              Повторить
            </Button>
          </div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg, idx) => {
            const prevMsg = idx > 0 ? messages[idx - 1] : undefined
            const showDate = shouldShowDateSeparator(msg.created_at, prevMsg?.created_at)

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] text-neutral-400 bg-neutral-100 rounded-full px-3 py-1">
                      {formatDateSeparator(msg.created_at)}
                    </span>
                  </div>
                )}
                {msg.message_type === 'meeting_invite' ? (() => {
                  try {
                    const meetingData = JSON.parse(msg.content)
                    return <MeetingCard meeting={meetingData} />
                  } catch {
                    return <MessageBubble message={msg} isOwn={isOwnMessage(msg)} />
                  }
                })() : (
                  <MessageBubble message={msg} isOwn={isOwnMessage(msg)} />
                )}
              </div>
            )
          })
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-full gap-2">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-1">
              <MessageCircleIcon className="w-7 h-7 text-accent-blue" />
            </div>
            <p className="text-neutral-900 font-medium text-sm">Начните общение!</p>
            <p className="text-neutral-400 text-xs">Напишите первое сообщение</p>
          </div>
        )}
        {isTyping && (
          <div className="flex justify-start mb-2">
            <div className="bg-neutral-100 px-4 py-2.5 rounded-2xl rounded-bl-md text-sm text-neutral-400 flex items-center gap-1">
              <span className="animate-bounce [animation-delay:0ms]">·</span>
              <span className="animate-bounce [animation-delay:150ms]">·</span>
              <span className="animate-bounce [animation-delay:300ms]">·</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>


      <div className="p-3 border-t border-neutral-100 bg-blue-50/30">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Введите сообщение..."
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              if (matchId && Date.now() - lastTypingSent.current > 2000) {
                sendWsTyping(matchId)
                lastTypingSent.current = Date.now()
              }
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-2.5 bg-transparent outline-none text-sm"
          />
          <button
            onClick={() => setMeetingModal(true)}
            className="p-2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
          >
            <CalendarIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
          >
            <PaperclipIcon className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            className="hidden"
          />
          {text.trim() && (
            <button
              onClick={handleSend}
              disabled={sendMessage.isPending}
              className={`p-2 cursor-pointer transition-opacity ${sendMessage.isPending ? 'opacity-40 pointer-events-none' : 'text-accent-blue hover:opacity-80'}`}
            >
              <SendIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>


      {match && (
        <Modal open={profileModal} onClose={() => setProfileModal(false)} title="Профиль">
          <div className="flex flex-col items-center py-4">
            <div className="w-32 h-32 rounded-2xl overflow-hidden mb-4">
              {match.user.avatar_url ? (
                <img src={match.user.avatar_url} alt={match.user.name} className="w-full h-full object-cover" />
              ) : (
                <Avatar name={match.user.name} size="xl" />
              )}
            </div>
            <h2 className="text-lg font-bold">
              {match.user.name}{match.user.age ? `, ${match.user.age} лет` : ''}
            </h2>
            {match.user.city && (
              <p className="text-sm text-neutral-500 mt-0.5">{match.user.city}</p>
            )}
            {match.user.bio && (
              <p className="text-sm text-neutral-400 mt-2 text-center max-w-xs">{match.user.bio}</p>
            )}
          </div>
        </Modal>
      )}


      <Modal open={meetingModal} onClose={() => setMeetingModal(false)} title="Назначьте свидание">
        <div className="space-y-3">
          <Input
            type="date"
            value={meetingForm.date}
            onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
            placeholder="Выберите дату встречи"
            icon={<CalendarIcon className="w-4 h-4" />}
          />
          <Input
            type="time"
            value={meetingForm.time}
            onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
            placeholder="Выберите время встречи"
            icon={<ClockIcon className="w-4 h-4" />}
          />
          <Input
            value={meetingForm.location}
            onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
            placeholder="Выберите место встречи"
            icon={<MapPinIcon className="w-4 h-4" />}
          />
          <textarea
            placeholder="Добавьте описание при необходимости"
            value={meetingForm.description}
            onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
            className="w-full px-4 py-3 text-sm bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-brand-500 resize-none h-20"
          />
          <Button
            fullWidth
            onClick={handleProposeMeeting}
            loading={proposeMeeting.isPending}
            disabled={!meetingForm.date || !meetingForm.time || !meetingForm.location}
          >
            Отправить
          </Button>
        </div>
      </Modal>


      <Modal open={reportModal} onClose={() => setReportModal(false)} title="Отправьте жалобу">
        <div className="space-y-3">
          {['Неприемлемый контент', 'Токсичное общение', 'Спам', 'Фейк', 'Угрозы'].map((reason) => (
            <label
              key={reason}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                ${reportReason === reason ? 'border-accent-blue bg-blue-50' : 'border-neutral-200'}`}
            >
              <input
                type="radio"
                name="chat_report_reason"
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
    </motion.div>
  )
}
