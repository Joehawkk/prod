import { NavLink } from 'react-router-dom'
import { useMatches } from '@/hooks/useMatches'
import { useLikesCount } from '@/hooks/useLikes'
import { HouseIcon, MessageCircleIcon, UserRoundIcon, HeartHandshakeIcon } from '../ui/Icons'

export function Sidebar() {
  const { data: matches } = useMatches()
  const likesCount = useLikesCount()
  const totalUnread = matches?.reduce((sum, m) => sum + (m.unread_count || 0), 0) || 0

  return (
    <nav className="hidden md:flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-sm w-[100px] flex-shrink-0 self-start sticky top-6">
      <NavLink
        to="/discover"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 ease-out active:scale-90 w-full select-none
          ${isActive ? 'text-accent-blue' : 'text-neutral-400 hover:text-neutral-600'}`
        }
      >
        <HouseIcon className="w-6 h-6" />
        <span className="text-xs font-medium">Лента</span>
      </NavLink>
      <NavLink
        to="/likes"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 ease-out active:scale-90 w-full select-none
          ${isActive ? 'text-accent-blue' : 'text-neutral-400 hover:text-neutral-600'}`
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
        <span className="text-xs font-medium">Симпатии</span>
      </NavLink>
      <NavLink
        to="/matches"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 ease-out active:scale-90 w-full select-none
          ${isActive ? 'text-accent-blue' : 'text-neutral-400 hover:text-neutral-600'}`
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
        <span className="text-xs font-medium">Чаты</span>
      </NavLink>
      <NavLink
        to="/profile"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 ease-out active:scale-90 w-full select-none
          ${isActive ? 'text-accent-blue' : 'text-neutral-400 hover:text-neutral-600'}`
        }
      >
        <UserRoundIcon className="w-6 h-6" />
        <span className="text-xs font-medium">Профиль</span>
      </NavLink>
    </nav>
  )
}
