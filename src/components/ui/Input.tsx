import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-600 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`w-full px-4 py-3 text-base bg-neutral-50 border rounded-xl
              outline-none transition-colors
              ${error ? 'border-accent-red' : 'border-neutral-200 focus:border-brand-500'}
              ${icon ? 'pr-12' : ''}
              ${className}`}
            {...props}
          />
          {icon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-accent-red">{error}</p>}
        {hint && !error && <p className="mt-1 text-sm text-neutral-400">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
