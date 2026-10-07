import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Role = 'management' | 'teacher'

type AppState = {
  route: string
  param?: string
  navigate: (route: string, param?: string) => void
  role: Role
  setRole: (r: Role) => void
  theme: 'light' | 'dark'
  toggleTheme: () => void
  logout: () => void
  cmdOpen: boolean
  setCmdOpen: (v: boolean) => void
}

const Ctx = createContext<AppState | null>(null)
export const useApp = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useApp outside provider')
  return c
}

export function AppProvider({ role, onLogout, children }: { role: Role; onLogout: () => void; children: ReactNode }) {
  const [route, setRoute] = useState(role === 'management' ? 'overview' : 'home')
  const [param, setParam] = useState<string | undefined>()
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )
  const [roleState, setRoleState] = useState<Role>(role)
  const [cmdOpen, setCmdOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  function navigate(r: string, p?: string) {
    setRoute(r)
    setParam(p)
    window.scrollTo({ top: 0 })
  }

  return (
    <Ctx.Provider
      value={{
        route,
        param,
        navigate,
        role: roleState,
        setRole: (r) => { setRoleState(r); setRoute(r === 'management' ? 'overview' : 'home'); setParam(undefined) },
        theme,
        toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
        logout: onLogout,
        cmdOpen,
        setCmdOpen,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}
