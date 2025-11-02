import { Outlet } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { NavBar } from '../NavBar'
import './index.scss'

export function AuthenticatedLayout() {
  const { loading, syncing, online, syncData } = useData()

  if (loading) {
    return (
      <div className="authenticated-layout">
        <NavBar onSync={syncData} syncing={syncing} online={online} />
        <div className="loading">
          <div className="loading-message">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="authenticated-layout">
      <NavBar onSync={syncData} syncing={syncing} online={online} />
      <main className="authenticated-main">
        <Outlet />
      </main>
    </div>
  )
}
