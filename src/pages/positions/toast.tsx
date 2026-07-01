import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { CircleCheck } from 'lucide-react'


interface Toast { id: number; title?: string; desc?: string; onUndo?: () => void; icon?: boolean }
interface Ctx { push: (t: Omit<Toast, 'id'>) => void }

const ToastCtx = createContext<Ctx>({ push: () => {} })
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), [])
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    setToasts((ts) => [...ts, { ...t, id }])
    setTimeout(() => dismiss(id), t.onUndo ? 7000 : 4200)
  }, [dismiss])

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      {/* Sonner spec: bg-popover, 1px border, rounded-md, p-4, gap-2, items-center, drop-shadow */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <div key={t.id}
            className="flex items-center gap-2 rounded-md border border-border bg-popover p-4 drop-shadow-[0px_4px_6px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-2 fade-in duration-200"
          >
            {t.icon && <CircleCheck className="h-5 w-5 shrink-0 text-foreground" />}
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              {t.title && <span className="text-[14px] leading-5 font-medium text-popover-foreground">{t.title}</span>}
              {t.desc && <span className="text-[14px] leading-5 text-muted-foreground">{t.desc}</span>}
            </div>
            {t.onUndo && (
              // Sonner action: bg-primary pill, h-24, px-2, rounded-sm (DS token), shadow-xs, text-xs Medium
              <button
                onClick={() => { t.onUndo!(); dismiss(t.id) }}
                className="shrink-0 h-6 px-2 rounded-sm bg-primary text-primary-foreground text-xs font-medium shadow-xs hover:bg-primary/90 transition-colors"
              >
                Undo
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
