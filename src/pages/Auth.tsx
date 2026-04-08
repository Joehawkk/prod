import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLogin } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { ArrowLeftIcon } from '@/components/ui/Icons'

export default function Auth() {
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [digits, setDigits] = useState('')
  const [code, setCode] = useState(['', '', '', ''])
  const [shake, setShake] = useState(false)
  const codeRefs = useRef<(HTMLInputElement | null)[]>([])

  const login = useLogin()

  const extractLocal = (raw: string): string => {
    let d = raw.replace(/\D/g, '')
    if (d.length === 11 && (d[0] === '7' || d[0] === '8')) d = d.slice(1)
    if (d.length > 10 && d[0] === '7') d = d.slice(1)
    return d.slice(0, 10)
  }

  const formatPhone = (local: string) => {
    if (local.length === 0) return '+7'
    let f = '+7 ('
    f += local.slice(0, 3)
    if (local.length > 3) f += ') ' + local.slice(3, 6)
    if (local.length > 6) f += '-' + local.slice(6, 8)
    if (local.length > 8) f += '-' + local.slice(8, 10)
    return f
  }

  const phone = formatPhone(digits)
  const getRawPhone = () => `+7${digits}`

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw.replace(/\D/g, '').length <= 1) {
      setDigits('')
      return
    }
    const allDigits = raw.replace(/\D/g, '')
    let local = allDigits
    if (local.length > 0 && local[0] === '7') local = local.slice(1)
    setDigits(local.slice(0, 10))
  }

  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text')
    setDigits(extractLocal(pasted))
  }

  const isPhoneComplete = digits.length === 10

  const handlePhoneSubmit = (digitsOverride?: string) => {
    const currentDigits = typeof digitsOverride === 'string' ? digitsOverride : digits
    if (currentDigits.length !== 10) return
    setStep('code')
    setTimeout(() => codeRefs.current[0]?.focus(), 100)
  }

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handlePhoneSubmit(extractLocal(e.currentTarget.value))
    }
  }

  const handleCodeInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)

    if (value && index < 3) {
      codeRefs.current[index + 1]?.focus()
    }

    if (newCode.every((c) => c) && newCode.join('').length === 4) {
      handleVerify(newCode.join(''))
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus()
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (code.every((c) => c)) {
        handleVerify(code.join(''))
      }
    }
  }

  const handleVerify = async (codeStr: string) => {
    const rawPhone = getRawPhone()
    try {
      await login.mutateAsync({ phone: rawPhone, code: codeStr })
    } catch {
      setShake(true)
      setCode(['', '', '', ''])
      codeRefs.current[0]?.focus()
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-neutral-100 relative overflow-hidden">
<div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(255,249,230,0.5) 0%, transparent 70%)',
        }}
      />

      <motion.div
        className="bg-white rounded-2xl shadow-sm max-w-md w-full p-8 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col items-center"
            >
              <h1 className="text-4xl font-bold tracking-tight mb-2">T-Match</h1>
              <p className="text-sm text-neutral-400 mb-8">Вход для клиентов Т-Банка</p>

              <div className="w-full space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1.5">Номер телефона</label>
                  <input
                    type="tel"
                    autoComplete="tel"
                    placeholder="+7 (999) 123-45-67"
                    value={phone}
                    onChange={handlePhoneChange}
                    onPaste={handlePhonePaste}
                    onKeyDown={handlePhoneKeyDown}
                    onFocus={() => {}}
                    className="w-full px-4 py-3 text-base bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
                <p className="text-xs text-neutral-400 text-center">
                  Код подтверждения придёт в СМС
                </p>
              </div>

              <Button
                className="mt-6"
                fullWidth
                size="lg"
                onClick={() => handlePhoneSubmit()}
                disabled={!isPhoneComplete}
              >
                Продолжить
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center"
            >
              <button
                onClick={() => { setStep('phone'); setCode(['', '', '', '']) }}
                className="self-start flex items-center gap-2 text-neutral-600 mb-6 cursor-pointer hover:text-neutral-900"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span className="font-medium">Назад</span>
              </button>

              <h2 className="text-xl font-bold mb-2">Введите код</h2>
              <p className="text-neutral-400 text-sm mb-6">
                Код отправлен на {phone}
              </p>

              <motion.div
                className="flex gap-3 mb-6"
                animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { codeRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeInput(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    className="w-14 h-14 text-center text-2xl font-bold border-2 border-neutral-200 rounded-xl
                      focus:border-brand-500 focus:outline-none transition-colors"
                  />
                ))}
              </motion.div>

              <Button
                fullWidth
                size="lg"
                loading={login.isPending}
                onClick={() => handleVerify(code.join(''))}
                disabled={code.some((c) => !c)}
              >
                Подтвердить
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
