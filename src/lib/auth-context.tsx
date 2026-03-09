import { createContext, useContext, useState, ReactNode } from 'react'
import { authApi } from '@/lib/api'

interface UserInfo {
  id:    string
  name:  string
  email: string
  role:  string
}

interface AuthContextType {
  currentUser:     UserInfo | null
  login:           (email: string, password: string) => Promise<boolean>
  logout:          () => void
  register:        (data: { name: string; email: string; password: string; role?: string }) => Promise<boolean>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  currentUser:     null,
  login:           async () => false,
  logout:          () => {},
  register:        async () => false,
  isAuthenticated: false,
})

const SESSION_KEY = 'sgfi_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user } = await authApi.login(email, password)
      setCurrentUser(user)
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
      return true
    } catch {
      return false
    }
  }

  const logout = () => {
    setCurrentUser(null)
    sessionStorage.removeItem(SESSION_KEY)
  }

  const register = async (data: { name: string; email: string; password: string; role?: string }): Promise<boolean> => {
    try {
      await authApi.register(data)
      return true
    } catch {
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, register, isAuthenticated: currentUser !== null }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
