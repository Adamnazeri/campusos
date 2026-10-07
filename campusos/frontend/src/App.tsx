import { useEffect, useState } from 'react'
import { AppProvider, useApp } from './lib/store'
import { ToastProvider } from './lib/ui'
import { Auth } from './components/Auth'
import { Onboarding } from './components/Onboarding'
import { Management } from './management'
import { Teacher } from './teacher'
import { api, getSession, isManagement, setSession, type ApiUser, type Session_ } from './lib/api'
import { LiveProvider } from './lib/live'
import { SessionContext } from './lib/session'

function RoleView() {
  const { role } = useApp()
  return role === 'management' ? <Management /> : <Teacher />
}

export default function App() {
  const [user, setUser] = useState<ApiUser | null>(() => getSession()?.user ?? null)
  const [onboarding, setOnboarding] = useState(false)

  // sesi tamat / ditolak pelayan → kembali ke layar log masuk
  useEffect(() => {
    const h = () => setUser(null)
    window.addEventListener('campusos:signout', h)
    return () => window.removeEventListener('campusos:signout', h)
  }, [])

  const enter = (s: Session_) => { setSession(s); setUser(s.user) }
  const signOut = async () => { await api.logout(); setSession(null); setUser(null) }

  if (onboarding) {
    return (
      <ToastProvider>
        <Onboarding onComplete={(s) => { enter(s); setOnboarding(false) }} onExit={() => setOnboarding(false)} />
      </ToastProvider>
    )
  }

  if (!user) return <Auth onEnter={enter} onStartOnboarding={() => setOnboarding(true)} />

  return (
    <ToastProvider>
      <SessionContext.Provider value={{ user, setUser, signOut: () => void signOut() }}>
        <LiveProvider key={user.id} user={user}>
          <AppProvider role={isManagement(user) ? 'management' : 'teacher'} onLogout={() => void signOut()}>
            <RoleView />
          </AppProvider>
        </LiveProvider>
      </SessionContext.Provider>
    </ToastProvider>
  )
}
