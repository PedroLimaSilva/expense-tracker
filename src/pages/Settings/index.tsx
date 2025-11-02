import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { CurrencySelector } from '../../components/CurrencySelector'
import { useNavigate } from 'react-router-dom'
import './index.scss'

export function Settings() {
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <div className="settings">
      <div className="settings-section">
        <h2>Appearance</h2>
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
        <h2>Currency</h2>
        <div className="settings-item">
          <CurrencySelector />
        </div>
      </div>

      <div className="settings-section">
        <h2>Account</h2>
        <div className="settings-item">
          <button onClick={handleLogout} className="btn btn-danger">
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
