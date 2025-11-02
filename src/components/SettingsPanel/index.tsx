import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { CurrencySelector } from '../CurrencySelector'
import './index.scss'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [isClosing, setIsClosing] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const touchStartTime = useRef<number | null>(null)
  const translateX = useRef<number>(0)

  // Handle rendering and opening animation
  useEffect(() => {
    if (isOpen) {
      // Render the component first
      setShouldRender(true)
      // Force a reflow, then trigger animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      setIsAnimating(false)
      setIsClosing(false)
      // Delay removing from DOM until after closing animation completes
      if (shouldRender) {
        const timer = setTimeout(() => {
          setShouldRender(false)
        }, 350) // Slightly longer than transition duration
        return () => clearTimeout(timer)
      }
    }
  }, [isOpen, shouldRender])

  // Handle swipe to close
  useEffect(() => {
    if (!isOpen) return

    const panel = panelRef.current
    if (!panel) return

    const handleTouchStart = (e: TouchEvent) => {
      const touchX = e.touches[0].clientX
      const panelRect = panel.getBoundingClientRect()
      const touchY = e.touches[0].clientY
      
      // Only start swipe detection if touch starts near the left edge (within 50px) or in the header
      const isNearLeftEdge = touchX - panelRect.left < 50
      const isInHeader = touchY - panelRect.top < 100
      
      if (isNearLeftEdge || isInHeader) {
        touchStartX.current = touchX
        touchStartTime.current = Date.now()
        translateX.current = 0
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null) return

      const currentX = e.touches[0].clientX
      const deltaX = currentX - touchStartX.current

      // Only allow swipe to the right (closing)
      if (deltaX > 0) {
        e.preventDefault() // Prevent scrolling during swipe
        translateX.current = Math.min(deltaX, panel.offsetWidth)
        panel.style.transition = 'none' // Disable transition during drag
        panel.style.transform = `translateX(${translateX.current}px)`
      }
    }

    const handleTouchEnd = () => {
      if (touchStartX.current === null) return

      const deltaX = translateX.current
      const threshold = panel.offsetWidth * 0.3 // Close if swiped more than 30%
      const velocity = touchStartTime.current
        ? deltaX / (Date.now() - touchStartTime.current)
        : 0

      // Close if swiped far enough or fast enough
      if (deltaX > threshold || velocity > 0.5) {
        closePanel()
      } else {
        // Snap back with smooth transition
        panel.style.transition = 'transform 0.3s ease-out'
        panel.style.transform = 'translateX(0)'
        translateX.current = 0
      }

      touchStartX.current = null
      touchStartTime.current = null
    }

    panel.addEventListener('touchstart', handleTouchStart, { passive: true })
    panel.addEventListener('touchmove', handleTouchMove, { passive: false })
    panel.addEventListener('touchend', handleTouchEnd)

    return () => {
      panel.removeEventListener('touchstart', handleTouchStart)
      panel.removeEventListener('touchmove', handleTouchMove)
      panel.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isOpen])

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        overlayRef.current &&
        overlayRef.current.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        closePanel()
      }
    }

    // Add slight delay to prevent immediate close on open
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePanel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const closePanel = () => {
    setIsAnimating(false)
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      setShouldRender(false)
      onClose()
      // Reset transform and transition
      if (panelRef.current) {
        panelRef.current.style.transform = 'translateX(0)'
        panelRef.current.style.transition = 'transform 0.3s ease-out'
        translateX.current = 0
      }
    }, 350) // Match transition duration
  }

  async function handleLogout() {
    try {
      onClose() // Close panel first
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (!shouldRender && !isClosing) return null

  return (
    <div
      ref={overlayRef}
      className={`settings-panel-overlay ${isAnimating && !isClosing ? 'open' : ''}`}
      onClick={(e) => {
        if (e.target === overlayRef.current) {
          closePanel()
        }
      }}
    >
      <div
        ref={panelRef}
        className={`settings-panel ${isAnimating && !isClosing ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-panel-header">
          <h2>Settings</h2>
          <button
            onClick={closePanel}
            className="btn btn-icon btn-close"
            title="Close"
            aria-label="Close settings"
          >
            <span className="material-icons">arrow_forward</span>
          </button>
        </div>

        <div className="settings-panel-content">
          <div className="settings-section">
            <h3>Appearance</h3>
            <div className="settings-item">
              <label>Theme</label>
              <button
                onClick={toggleTheme}
                className="btn btn-secondary theme-toggle"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h3>Currency</h3>
            <div className="settings-item">
              <CurrencySelector />
            </div>
          </div>

          <div className="settings-section">
            <h3>Account</h3>
            <div className="settings-item">
              <button onClick={handleLogout} className="btn btn-danger">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
