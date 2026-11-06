import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { BookingPage } from './components/ClientBooking/BookingPage'
import { AdminLogin } from './components/AdminDashboard/AdminLogin'
import { AdminDashboard } from './components/AdminDashboard/AdminDashboard'
import { Brand } from './components/ui/brand'
import { useAdminAuth } from './hooks/useAdminAuth'

function getRoute() {
  const hash = (window.location.hash || '#/').replace(/^#/, '')
  const normalized = hash.replace(/^\/+/, '')
  return normalized === 'admin' || normalized.startsWith('admin/') ? 'admin' : 'public'
}

function AuthLoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-cream-50 px-6">
      <div className="flex flex-col items-center text-center">
        <Brand name="Serein Studio" />
        <div className="mt-7 flex items-center gap-2.5 rounded-full border border-line bg-white px-4 py-2 text-[11px] font-semibold text-muted shadow-soft">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-forest-600" aria-hidden="true" />
          Comprobando acceso al panel…
        </div>
      </div>
    </div>
  )
}

function AdminArea() {
  const { session, loading, signIn, signOut, isDemo } = useAdminAuth()

  if (loading) return <AuthLoadingScreen />

  if (isDemo) {
    return <AdminDashboard session={null} isDemo onSignOut={signOut} />
  }

  if (!session) {
    return <AdminLogin onLogin={signIn} />
  }

  return <AdminDashboard session={session} isDemo={false} onSignOut={signOut} />
}

export default function App() {
  const [route, setRoute] = useState(getRoute)
  const previousRoute = useRef(route)

  useEffect(() => {
    const handleHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    document.title =
      route === 'admin'
        ? 'Panel de gestión — Serein Studio'
        : 'Serein Studio — Reserva tu cita'
  }, [route])

  useEffect(() => {
    if (previousRoute.current === route) return
    previousRoute.current = route
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [route])

  return route === 'admin' ? <AdminArea /> : <BookingPage />
}
