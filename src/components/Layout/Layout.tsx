import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'

export default function Layout() {
  return (
    <div className="app-container">
      <div className="layout">
        <main className="main-content">
          <Outlet />
        </main>
        <Sidebar />
      </div>
    </div>
  )
}