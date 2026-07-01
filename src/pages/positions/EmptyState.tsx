import { SearchX } from 'lucide-react'

export function SearchEmpty({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted text-muted-foreground">
        <SearchX className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-foreground">No roles match "{query}"</p>
      <p className="text-sm text-muted-foreground">Try a different search, or clear it to see everything.</p>
    </div>
  )
}
