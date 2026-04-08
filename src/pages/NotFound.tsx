import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-neutral-200 mb-4">404</h1>
        <p className="text-neutral-400 mb-6">Страница не найдена</p>
        <Button onClick={() => navigate('/')}>На главную</Button>
      </div>
    </div>
  )
}
