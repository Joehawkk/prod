import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMatches } from '@/hooks/useMatches'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageTransition } from '@/components/ui/PageTransition'
import { ArrowLeftIcon, ArrowRightIcon, TriangleAlertIcon, HeartIcon } from '@/components/ui/Icons'
import type { Match } from '@/types'

function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN)
  if (dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr)) return new Date(dateStr)
  return new Date(dateStr + 'Z')
}

function formatDate(dateStr: string) {
  const date = parseDate(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = diffMs / (1000 * 60)

  if (diffMin < 1) return 'только что'
  if (diffMin < 60) return `${Math.floor(diffMin)} мин. назад`
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours < 24) return `${Math.floor(diffHours)} ч. назад`

  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function MatchListItem({ match, onClick }: { match: Match; onClick: () => void }) {
  return (
    <motion.button
      className="w-full flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer text-left"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="relative">
        <Avatar src={match.user.avatar_url} name={match.user.name} size="md" />
        {match.unread_count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent-blue rounded-full border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={`text-sm truncate ${match.unread_count > 0 ? 'font-bold text-neutral-900' : 'font-medium text-neutral-700'}`} title={match.user.name}>
            {match.user.name}
          </span>
          {match.last_message && (
            <span className="text-xs text-neutral-400 flex-shrink-0 ml-2">
              {formatDate(match.last_message.created_at)}
            </span>
          )}
        </div>
        {match.last_message && (
          <p className={`text-sm truncate mt-0.5 ${match.unread_count > 0 ? 'text-neutral-700 font-medium' : 'text-neutral-400'}`}>
            {match.last_message.content}
          </p>
        )}
      </div>
      {match.unread_count > 0 && (
        <Badge variant="count">
          {match.unread_count > 99 ? '99+' : match.unread_count}
        </Badge>
      )}
    </motion.button>
  )
}

export default function Matches() {
  const navigate = useNavigate()
  const { data: matches, isLoading, isError, refetch } = useMatches()
  const [showAllNew, setShowAllNew] = useState(false)

  const newMatches = matches?.filter((m) => !m.last_message)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || []
  const conversations = matches?.filter((m) => m.last_message)
    .sort((a, b) => new Date(b.last_message!.created_at).getTime() - new Date(a.last_message!.created_at).getTime()) || []

  if (isLoading) {
    return (
      <PageTransition>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <Skeleton className="w-48 h-7 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="w-24 h-4 mb-2" />
                  <Skeleton className="w-40 h-3" />
                </div>
              </div>
            ))}
          </div>
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
          <p className="text-neutral-900 font-medium mb-1">Не удалось загрузить чаты</p>
          <p className="text-neutral-400 text-sm mb-4">Проверьте подключение и попробуйте снова</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Повторить
          </Button>
        </div>
      </PageTransition>
    )
  }

  if (!matches || matches.length === 0) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <HeartIcon className="w-8 h-8 text-brand-500" />
          </div>
          <h1 className="text-xl font-bold mb-2">Пока нет мэтчей</h1>
          <p className="text-neutral-400 text-sm">Свайпай в Ленте, чтобы найти совпадения</p>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
    <div className="bg-white rounded-2xl shadow-sm p-6">
      {newMatches.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Новые совпадения</h2>
            {newMatches.length > 5 && (
              <button
                className="flex items-center gap-1 text-sm text-accent-blue hover:text-accent-blue/80 cursor-pointer"
                onClick={() => setShowAllNew((v) => !v)}
              >
                {showAllNew ? 'Свернуть' : 'Все'} <ArrowRightIcon className={`w-4 h-4 transition-transform ${showAllNew ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>
          <div className={`flex gap-4 pb-2 ${showAllNew ? 'flex-wrap' : 'overflow-x-auto'}`}>
            {(showAllNew ? newMatches : newMatches.slice(0, 10)).map((match) => (
              <button
                key={match.id}
                onClick={() => navigate(`/matches/${match.id}`)}
                className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
              >
                <Avatar src={match.user.avatar_url} name={match.user.name} size="lg" />
                <span className="text-xs text-neutral-600 max-w-[64px] truncate" title={match.user.name}>
                  {match.user.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {conversations.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Сообщения</h2>
          <div className="divide-y divide-neutral-100">
            {conversations.map((match) => (
              <MatchListItem
                key={match.id}
                match={match}
                onClick={() => navigate(`/matches/${match.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  )
}
