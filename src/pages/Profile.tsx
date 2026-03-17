import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProfile } from '@/hooks/useProfile'
import { profileApi } from '@/api/profile'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageTransition } from '@/components/ui/PageTransition'
import { PencilIcon, LogOutIcon, TriangleAlertIcon } from '@/components/ui/Icons'

export default function Profile() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: profile, isLoading, isError, refetch } = useProfile()
  const logout = useAuthStore((s) => s.logout)
  const [logoutModal, setLogoutModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await profileApi.uploadAvatar(file)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      useUiStore.getState().addToast({ type: 'success', message: 'Фото обновлено' })
    } catch {
      useUiStore.getState().addToast({ type: 'error', message: 'Не удалось загрузить фото' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/auth', { replace: true })
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await profileApi.delete()
      logout()
      navigate('/auth', { replace: true })
    } catch {
      useUiStore.getState().addToast({ type: 'error', message: 'Не удалось удалить профиль' })
    } finally {
      setDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-4">
          <Skeleton className="w-40 h-7" />
          <div className="bg-white rounded-2xl p-6">
            <Skeleton className="w-32 h-32 rounded-full mx-auto mb-4" />
            <Skeleton className="w-36 h-5 mx-auto mb-2" />
            <Skeleton className="w-28 h-4 mx-auto" />
          </div>
        </div>
      </PageTransition>
    )
  }

  if (isError) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-accent-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <TriangleAlertIcon className="w-7 h-7 text-accent-red" />
          </div>
          <p className="text-neutral-900 font-medium mb-1">Не удалось загрузить профиль</p>
          <p className="text-neutral-400 text-sm mb-4">Проверьте подключение и попробуйте снова</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Повторить
          </Button>
        </div>
      </PageTransition>
    )
  }

  if (!profile) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <p className="text-neutral-400 mb-4">Профиль не найден</p>
          <Button onClick={() => navigate('/onboarding')}>Создать профиль</Button>
        </div>
      </PageTransition>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-4"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      <h1 className="text-2xl font-bold px-1">Мой профиль</h1>

      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center">
        <div className="relative mb-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-44 h-44 rounded-full overflow-hidden border-4 border-white shadow-md cursor-pointer group"
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-full h-full object-cover group-hover:brightness-90 transition-all"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-brand-100 flex items-center justify-center group-hover:brightness-90 transition-all">
                <span className="text-4xl font-bold text-brand-700">
                  {profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
            )}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-md hover:bg-amber-500 active:scale-95 transition-all cursor-pointer"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <PencilIcon className="w-4.5 h-4.5" />
            )}
          </button>
        </div>

        <h2 className="text-xl font-bold text-neutral-900">
          {profile.name}{profile.age ? `, ${profile.age}` : ''}
        </h2>
        {profile.city && (
          <p className="text-sm text-neutral-400 mt-1">{profile.city}</p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <Button
          variant="secondary"
          fullWidth
          iconLeft={<LogOutIcon className="w-4 h-4" />}
          onClick={() => setLogoutModal(true)}
        >
          Выйти из аккаунта
        </Button>
        <button
          onClick={() => setDeleteModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-accent-red font-medium text-sm hover:bg-red-100 active:scale-[0.98] transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
          Удалить профиль
        </button>
      </div>

      <Modal open={logoutModal} onClose={() => setLogoutModal(false)} title="Выход из аккаунта">
        <p className="text-sm text-neutral-600 mb-4">Вы уверены, что хотите выйти?</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setLogoutModal(false)}>
            Отмена
          </Button>
          <Button variant="danger" fullWidth onClick={handleLogout}>
            Выйти
          </Button>
        </div>
      </Modal>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Удаление профиля">
        <p className="text-sm text-neutral-600 mb-4">
          Это действие необратимо. Все ваши данные, мэтчи и сообщения будут удалены.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setDeleteModal(false)}>
            Отмена
          </Button>
          <Button variant="danger" fullWidth onClick={handleDelete} loading={deleting}>
            Удалить
          </Button>
        </div>
      </Modal>
    </motion.div>
  )
}
