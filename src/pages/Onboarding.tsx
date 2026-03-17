import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileApi } from '@/api/profile'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button'
import { DownloadIcon } from '@/components/ui/Icons'

export default function Onboarding() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (selected.size > 5 * 1024 * 1024) {
      useUiStore.getState().addToast({ type: 'error', message: 'Максимальный размер фото 5 МБ' })
      return
    }

    setFile(selected)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(selected)
  }

  const handleSubmit = async () => {
    if (!file) return
    setUploading(true)
    try {
      await profileApi.uploadAvatar(file)
      useAuthStore.getState().setHasProfile(true)
      navigate('/discover', { replace: true })
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error?.message
      useUiStore.getState().addToast({
        type: 'error',
        message: serverMsg || 'Не удалось загрузить фото',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-neutral-100">
      <div className="bg-white rounded-2xl shadow-sm max-w-md w-full p-8">
        <h1 className="text-xl font-bold text-center mb-2">Загрузите фото</h1>
        <p className="text-sm text-neutral-400 text-center mb-8">
          Добавьте аватарку, чтобы начать
        </p>

        <div className="flex flex-col items-center mb-8">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-40 h-40 rounded-2xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-500 transition-colors bg-neutral-50 overflow-hidden"
          >
            {preview ? (
              <img src={preview} alt="Аватар" className="w-full h-full object-cover" />
            ) : (
              <>
                <DownloadIcon className="w-8 h-8 text-neutral-400" />
                <span className="text-sm text-neutral-400">Выбрать фото</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {preview && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 text-sm text-accent-blue hover:underline cursor-pointer"
            >
              Изменить
            </button>
          )}
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={handleSubmit}
          loading={uploading}
          disabled={!file}
          className={!file ? 'opacity-50' : ''}
        >
          Продолжить
        </Button>
      </div>
    </div>
  )
}
