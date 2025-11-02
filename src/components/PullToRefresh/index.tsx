import { useState, useRef, useEffect, type ReactNode } from 'react'
import './index.scss'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  enabled?: boolean
  children: ReactNode
  disabled?: boolean
}

export function PullToRefresh({ onRefresh, enabled = true, children, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef<number | null>(null)
  const threshold = 80
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled || disabled || isRefreshing) return

    const handleTouchStart = (e: TouchEvent) => {
      // Check if we're at the top of the page or scrollable container
      const scrollTop = window.scrollY || document.documentElement.scrollTop

      // Only start pull if at the top
      if (scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null) return

      const scrollTop = window.scrollY || document.documentElement.scrollTop

      // Only allow pull if still at top
      if (scrollTop === 0) {
        const touchY = e.touches[0].clientY
        const deltaY = touchY - touchStartY.current

        if (deltaY > 0) {
          e.preventDefault()
          setIsPulling(true)
          // Apply resistance
          const resistance = 0.5
          const distance = deltaY * resistance
          setPullDistance(Math.min(distance, threshold * 1.5))
        }
      } else {
        // Reset if user scrolls down
        touchStartY.current = null
        setIsPulling(false)
        setPullDistance(0)
      }
    }

    const handleTouchEnd = async () => {
      if (touchStartY.current === null) return

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } catch (error) {
          console.error('Error refreshing:', error)
        } finally {
          setIsRefreshing(false)
        }
      }

      // Reset
      touchStartY.current = null
      setIsPulling(false)
      setPullDistance(0)
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onRefresh, enabled, disabled, isRefreshing, pullDistance, threshold])

  const showIndicator = isPulling || isRefreshing
  const indicatorOffset = isPulling ? Math.max(0, pullDistance - 30) : 0

  return (
    <div ref={containerRef} className="pull-to-refresh-container">
      {showIndicator && (
        <div
          className="pull-to-refresh-indicator"
          style={{
            transform: `translateX(-50%) translateY(${indicatorOffset}px)`,
            opacity: showIndicator ? 1 : 0,
          }}
        >
          <div className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`}>
            <span className="material-icons">sync</span>
          </div>
        </div>
      )}
      {children}
    </div>
  )
}
