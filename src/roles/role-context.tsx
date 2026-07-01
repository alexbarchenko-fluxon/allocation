import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { type AppRole, DEFAULT_ROLE, ROLE_STORAGE_KEY } from "./roles"

interface RoleContextValue {
  role: AppRole
  setRole: (role: AppRole) => void
}

const RoleContext = createContext<RoleContextValue | null>(null)

function readStoredRole(): AppRole {
  try {
    const stored = localStorage.getItem(ROLE_STORAGE_KEY)
    if (stored === "editor" || stored === "readonly") return stored
  } catch {
    // localStorage unavailable (e.g. private browsing restrictions)
  }
  return DEFAULT_ROLE
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<AppRole>(readStoredRole)

  const setRole = useCallback((next: AppRole) => {
    setRoleState(next)
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, next)
    } catch {
      // ignore storage errors
    }
  }, [])

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  )
}

/** Returns the current role and a setter. Must be used inside <RoleProvider>. */
export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error("useRole must be used within <RoleProvider>")
  return ctx
}
