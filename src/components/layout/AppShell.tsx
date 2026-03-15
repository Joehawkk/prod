import { Outlet } from 'react-router-dom'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { MessageNotifications } from '@/components/ui/MessageNotifications'

export function AppShell() {
  useWebSocket()

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <div className="flex-1 flex gap-4 md:gap-6 max-w-4xl mx-auto w-full px-3 sm:px-4 py-4 md:py-6">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <MessageNotifications />
      <div className="md:hidden h-[calc(4rem+env(safe-area-inset-bottom,0px))]" />
    </div>
  )
}
