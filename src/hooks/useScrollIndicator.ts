import { useEffect } from "react"

interface UseScrollIndicatorOptions {
  timeoutMs?: number
}

/**
 * Adds `.is-scrolling` to the element while it is actively scrolling,
 * then removes it after `timeoutMs` of inactivity. Pair with the
 * `scrollbar-minimal` CSS utility to show the scrollbar thumb only
 * on hover or during active scrolling.
 */
export function useScrollIndicator(
  ref: React.RefObject<HTMLElement | null>,
  { timeoutMs = 600 }: UseScrollIndicatorOptions = {}
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    let timer: ReturnType<typeof setTimeout>

    const handleScroll = () => {
      el.classList.add("is-scrolling")
      clearTimeout(timer)
      timer = setTimeout(() => {
        el.classList.remove("is-scrolling")
      }, timeoutMs)
    }

    el.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      el.removeEventListener("scroll", handleScroll)
      clearTimeout(timer)
    }
  }, [ref, timeoutMs])
}
