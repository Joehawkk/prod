import { NavLink } from 'react-router-dom'
import { useMatches } from '@/hooks/useMatches'
import { useLikesCount } from '@/hooks/useLikes'
import { HouseIcon, MessageCircleIcon, UserRoundIcon, HeartHandshakeIcon } from '../ui/Icons'

export function BottomNav() {
  const { data: matches } = useMatches()
  const likesCount = useLikesCount()
  const totalUnread = matches?.reduce((sum, m) => sum + (m.unread_count || 0), 0) || 0

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-40 safe-bottom">
      <div className="flex justify-around items-center py-2">
        <NavLink
          to="/discover"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 p-2 min-w-[56px] transition-all duration-200 ease-out active:scale-90 select-none
            ${isActive ? 'text-accent-blue' : 'text-neutral-400 active:text-neutral-600'}`
          }
        >
          <HouseIcon className="w-6 h-6" />
          <span className="text-[11px] font-medium">Лента</span>
        </NavLink>
        <NavLink
          to="/likes"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 p-2 min-w-[56px] transition-all duration-200 ease-out active:scale-90 relative select-none
            ${isActive ? 'text-accent-blue' : 'text-neutral-400 active:text-neutral-600'}`
          }
        >
          <div className="relative">
            <HeartHandshakeIcon className="w-6 h-6" />
            {likesCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {likesCount > 99 ? '99+' : likesCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium">Симпатии</span>
        </NavLink>
        <NavLink
          to="/matches"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 p-2 min-w-[56px] transition-all duration-200 ease-out active:scale-90 relative select-none
            ${isActive ? 'text-accent-blue' : 'text-neutral-400 active:text-neutral-600'}`
          }
        >
          <div className="relative">
            <MessageCircleIcon className="w-6 h-6" />
            {totalUnread > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] bg-accent-red text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium">Чаты</span>
        </NavLink>
        <NavLink
          to="/profile"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 p-2 min-w-[56px] transition-all duration-200 ease-out active:scale-90 select-none
            ${isActive ? 'text-accent-blue' : 'text-neutral-400 active:text-neutral-600'}`
          }
        >
          <UserRoundIcon className="w-6 h-6" />
          <span className="text-[11px] font-medium">Профиль</span>
        </NavLink>
      </div>
    </nav>
  )
}
