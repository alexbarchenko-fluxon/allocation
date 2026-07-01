/** All possible app-level roles. */
export type AppRole = "editor" | "readonly"

export const APP_ROLES: { value: AppRole; label: string }[] = [
  { value: "editor", label: "Edit rights user" },
  { value: "readonly", label: "Read-only user" },
]

export const ROLE_STORAGE_KEY = "allox.role"

export const DEFAULT_ROLE: AppRole = "editor"
