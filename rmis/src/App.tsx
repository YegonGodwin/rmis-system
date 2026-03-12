import { useEffect, useState } from 'react'
import AdminDashboardPage from './pages/AdminDashboardPage'
import PhysicianDashboardPage from './pages/PhysicianDashboardPage'
import RadiologistDashboardPage from './pages/RadiologistDashboardPage'
import TechnicianDashboardPage from './pages/TechnicianDashboardPage'
import LoginPage from './pages/LoginPage'
import { useSocket } from './hooks/useSocket'
import NotificationToast from './components/NotificationToast'

const LOGIN_PATH = '/login'
const ADMIN_DASHBOARD_PATH = '/admin/dashboard'
const PHYSICIAN_DASHBOARD_PATH = '/physician/dashboard'
const RADIOLOGIST_DASHBOARD_PATH = '/radiologist/dashboard'
const TECHNICIAN_DASHBOARD_PATH = '/technician/dashboard'

const setRoute = (path: string) => {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path)
  }
}

const App = () => {
  const [path, setPath] = useState(window.location.pathname)
  const { latestNotification, clearNotification } = useSocket()

  useEffect(() => {
    if (window.location.pathname !== LOGIN_PATH) {
      window.history.replaceState({}, '', LOGIN_PATH)
      setPath(LOGIN_PATH)
    }

    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)

    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const goToLogin = () => {
    setRoute(LOGIN_PATH)
    setPath(LOGIN_PATH)
  }

  const goToAdminDashboard = () => {
    setRoute(ADMIN_DASHBOARD_PATH)
    setPath(ADMIN_DASHBOARD_PATH)
  }

  const goToPhysicianDashboard = () => {
    setRoute(PHYSICIAN_DASHBOARD_PATH)
    setPath(PHYSICIAN_DASHBOARD_PATH)
  }

  const goToRadiologistDashboard = () => {
    setRoute(RADIOLOGIST_DASHBOARD_PATH)
    setPath(RADIOLOGIST_DASHBOARD_PATH)
  }

  const goToTechnicianDashboard = () => {
    setRoute(TECHNICIAN_DASHBOARD_PATH)
    setPath(TECHNICIAN_DASHBOARD_PATH)
  }

  if (path === ADMIN_DASHBOARD_PATH) {
    return <AdminDashboardPage onLogout={goToLogin} />
  }

  if (path === PHYSICIAN_DASHBOARD_PATH) {
    return <PhysicianDashboardPage onLogout={goToLogin} />
  }

  if (path === RADIOLOGIST_DASHBOARD_PATH) {
    return <RadiologistDashboardPage onLogout={goToLogin} />
  }

  if (path === TECHNICIAN_DASHBOARD_PATH) {
    return <TechnicianDashboardPage onLogout={goToLogin} />
  }

  return (
    <>
      <LoginPage
        onAdminLogin={goToAdminDashboard}
        onPhysicianLogin={goToPhysicianDashboard}
        onRadiologistLogin={goToRadiologistDashboard}
        onTechnicianLogin={goToTechnicianDashboard}
      />
      <NotificationToast notification={latestNotification} onClear={clearNotification} />
    </>
  )
}

export default App
