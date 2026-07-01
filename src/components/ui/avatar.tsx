import * as React from "react"
import { cn } from "@/lib/utils"

export interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: "sm" | "md" | "lg"
  fallback?: string
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
}

function Avatar({ 
  size = "sm", 
  fallback,
  className, 
  alt,
  ...props 
}: AvatarProps) {
  const [error, setError] = React.useState(false)

  return (
    <div className={cn(
      "relative shrink-0 overflow-hidden rounded-full",
      sizeClasses[size],
      className
    )}>
      {!error && props.src ? (
        <img
          {...props}
          alt={alt || "Avatar"}
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-xs font-medium">
          {fallback || (alt ? alt.charAt(0).toUpperCase() : "?")}
        </div>
      )}
    </div>
  )
}

export { Avatar }
