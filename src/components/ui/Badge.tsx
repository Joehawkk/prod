interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'brand' | 'count'
  className?: string
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-neutral-100 text-neutral-600',
    brand: 'bg-brand-50 text-brand-700',
    count: 'bg-brand-500 text-neutral-900 min-w-[24px] h-6 rounded-full text-xs font-bold',
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg text-sm font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
