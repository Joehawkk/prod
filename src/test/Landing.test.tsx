import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Landing from '@/pages/Landing'

function renderLanding() {
  return render(
    <BrowserRouter>
      <Landing />
    </BrowserRouter>
  )
}

describe('Landing page', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('renders the title', () => {
    renderLanding()
    expect(screen.getByText('T-Match')).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    renderLanding()
    expect(screen.getByText('Найди свою половинку')).toBeInTheDocument()
  })

  it('renders the start button', () => {
    renderLanding()
    expect(screen.getByText('Начать')).toBeInTheDocument()
  })

  it('renders all 3 feature cards', () => {
    renderLanding()
    expect(screen.getByText('Свайпай!')).toBeInTheDocument()
    expect(screen.getByText('Общайся!')).toBeInTheDocument()
    expect(screen.getByText('Встречайся!')).toBeInTheDocument()
  })

  it('renders feature descriptions', () => {
    renderLanding()
    expect(screen.getByText('Находи людей, которые тебе нравятся')).toBeInTheDocument()
    expect(screen.getByText('Пиши тем, кто понравился тебе в ответ')).toBeInTheDocument()
    expect(screen.getByText('Назначай встречи и общайся вживую')).toBeInTheDocument()
  })

  it('renders footer with year', () => {
    renderLanding()
    const year = new Date().getFullYear()
    expect(screen.getByText(`T-Match ${year}`)).toBeInTheDocument()
  })
})
