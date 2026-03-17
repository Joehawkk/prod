import type { ReactNode } from 'react'
import { Button } from './Button'

interface StateViewProps {
  icon: ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  variant?: 'error' | 'empty' | 'neutral'
}

const iconBg = {
  error: 'bg-accent-red/10',
  empty: 'bg-brand-50',
  neutral: 'bg-neutral-100',
}

export function StateView({ icon, title, description, action, variant = 'neutral' }: StateViewProps) {
  return (
    <div className="text-center py-16 px-6">
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${iconBg[variant]}`}
      >
        {icon}
      </div>
      <h2 className="text-xl font-bold text-neutral-900 mb-2">{title}</h2>
      {description && (
        <p className="text-neutral-500 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant={variant === 'error' ? 'secondary' : 'primary'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
