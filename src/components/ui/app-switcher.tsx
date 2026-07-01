import * as React from "react"
import { Grip } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import LuxLogo from "@/assets/logos/app-logos/lux-logo.svg?react"
import FoxLogo from "@/assets/logos/app-logos/fox-logo.svg?react"
import SparkLogo from "@/assets/logos/app-logos/spark-logo.svg?react"

interface App {
  id: string
  name: string
  logo: React.ComponentType<React.SVGProps<SVGSVGElement>>
  href: string
}

const apps: App[] = [
  { id: "lux", name: "Lux", logo: LuxLogo, href: "#" },
  { id: "fox", name: "Fox", logo: FoxLogo, href: "#" },
  { id: "spark", name: "Spark", logo: SparkLogo, href: "#" },
]

export function AppSwitcher() {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          aria-label="Switch apps"
        >
          <Grip className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-6" align="end">
        <div className="flex gap-2">
          {apps.map((app) => {
            const Logo = app.logo
            return (
              <a
                key={app.id}
                href={app.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-accent transition-colors"
                onClick={() => setOpen(false)}
              >
                <Logo className="w-12 h-12" />
                <span className="text-sm font-medium text-popover-foreground">
                  {app.name}
                </span>
              </a>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
