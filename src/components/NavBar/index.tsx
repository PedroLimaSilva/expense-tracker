import { useNavigate, useLocation } from 'react-router-dom'
import './index.scss'

interface NavBarProps {
  onSync: () => void
  syncing: boolean
  online: boolean
}

export function NavBar({ onSync, syncing, online }: NavBarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const handleTabClick = (path: string) => {
    navigate(path)
  }

  // Show tabs only on these routes
  const showTabs = ['/overview', '/', '/income', '/expenses', '/categories'].includes(location.pathname)

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-title">
          <h1>Expense Tracker</h1>
        </div>
        
        <div className="navbar-actions">
          <div className="status-indicators">
            {online ? (
              <span className="status-badge online" title="Online">Online</span>
            ) : (
              <span className="status-badge offline" title="Offline">Offline</span>
            )}
            <button
              onClick={onSync}
              disabled={syncing || !online}
              className="btn btn-small btn-secondary btn-icon"
              title="Sync with cloud"
            >
              <span className={`material-icons ${syncing ? 'sync-animation' : ''}`}>
                sync
              </span>
            </button>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="btn btn-icon btn-settings"
            title="Settings"
          >
            <span className="material-icons">settings</span>
          </button>
        </div>
      </div>

      {showTabs && (
        <div className="navbar-tabs">
          <button
            className={`navbar-tab ${isActive('/overview') || isActive('/') ? 'active' : ''}`}
            onClick={() => handleTabClick('/overview')}
          >
            Overview
          </button>
          <button
            className={`navbar-tab ${isActive('/income') ? 'active' : ''}`}
            onClick={() => handleTabClick('/income')}
          >
            Income
          </button>
          <button
            className={`navbar-tab ${isActive('/expenses') ? 'active' : ''}`}
            onClick={() => handleTabClick('/expenses')}
          >
            Expenses
          </button>
          <button
            className={`navbar-tab ${isActive('/categories') ? 'active' : ''}`}
            onClick={() => handleTabClick('/categories')}
          >
            Categories
          </button>
        </div>
      )}
    </nav>
  )
}
