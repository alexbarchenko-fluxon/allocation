import { useState } from "react"
import * as Popover from "@radix-ui/react-popover"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRole } from "@/roles/role-context"
import { APP_ROLES, type AppRole } from "@/roles/roles"
import { MOCK_PEOPLE } from "@/mocks/people"

// Use real photos from MOCK_PEOPLE: James Foster (CEO) for editor, Sarah Kim (COO) for readonly
const editorPerson = MOCK_PEOPLE.find(p => p.id === "person-1")!
const readonlyPerson = MOCK_PEOPLE.find(p => p.id === "person-2")!

const ROLE_AVATAR: Record<AppRole, { src: string; alt: string }> = {
  editor:   { src: editorPerson.avatar,   alt: editorPerson.name },
  readonly: { src: readonlyPerson.avatar, alt: readonlyPerson.name },
}

export function RoleAvatar() {
  const { role } = useRole()
  const cfg = ROLE_AVATAR[role]

  return (
    <div className="h-8 w-8 rounded-full overflow-hidden shrink-0">
      <img
        src={cfg.src}
        alt={cfg.alt}
        className="h-full w-full object-cover"
      />
    </div>
  )
}

export function RoleSwitcher() {
  const { role, setRole } = useRole()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center gap-1.5">
      <RoleAvatar />

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground",
              "hover:bg-accent hover:text-foreground transition-colors",
              open && "bg-accent text-foreground"
            )}
            aria-label="Switch role"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-150", open && "rotate-180")}
            />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={6}
            className={cn(
              "z-50 min-w-[180px] overflow-hidden rounded-lg border border-border bg-popover shadow-md",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[side=bottom]:slide-in-from-top-2"
            )}
          >
            <div className="px-1 py-1">
              <p className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Role
              </p>
              {APP_ROLES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setRole(value)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5",
                    "text-sm text-foreground hover:bg-accent transition-colors",
                    role === value && "font-medium"
                  )}
                >
                  <span className="flex h-4 w-4 items-center justify-center">
                    {role === value && <Check className="h-3.5 w-3.5 text-foreground" />}
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
