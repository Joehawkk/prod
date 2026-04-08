import { Component, type ReactNode } from 'react'
import { Button } from './ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorCode: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorCode: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    const errorCode = `E-${Date.now()}`
    return { hasError: true, error, errorCode }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error)
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorCode: '' })
  }

  handleCopyReport = async () => {
    const { error, errorCode } = this.state
    const report = [
      `Код ошибки: ${errorCode}`,
      `Время: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      `UA: ${navigator.userAgent}`,
      `Ошибка: ${error?.name ?? 'Unknown'}: ${error?.message ?? 'No message'}`,
      `Stack: ${error?.stack ?? 'N/A'}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(report)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = report
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-neutral-100">
          <div className="bg-white rounded-2xl shadow-sm max-w-sm w-full p-8 text-center">
            <div className="w-16 h-16 bg-accent-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent-red" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
                <path d="M12 9v4"/><path d="M12 17h.01"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">Что-то пошло не так</h2>
            <p className="text-sm text-neutral-400 mb-3">Произошла непредвиденная ошибка. Попробуйте обновить страницу.</p>
            <p className="text-xs text-neutral-300 mb-6 font-mono select-all">
              Код ошибки: {this.state.errorCode}
            </p>
            <div className="flex gap-3 mb-3">
              <Button variant="secondary" fullWidth onClick={this.handleReset}>
                Попробовать снова
              </Button>
              <Button fullWidth onClick={() => window.location.reload()}>
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M8 16H3v5"/>
                  </svg>
                  Обновить
                </span>
              </Button>
            </div>
            <button
              onClick={this.handleCopyReport}
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors underline underline-offset-2"
            >
              Скопировать отчёт
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
