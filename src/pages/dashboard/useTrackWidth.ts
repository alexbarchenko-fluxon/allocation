import { useLayoutEffect, useRef, useState, useCallback } from 'react'

/**
 * Measure a track element's pixel width so timeline bars can be positioned by
 * date. Uses a callback ref (measures on attach) plus a ResizeObserver for
 * later layout changes. All lanes share one width so bars line up.
 */
export function useTrackWidth() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  const setRef = useCallback((el: HTMLDivElement | null) => {
    ref.current = el
    if (el) {
      setWidth(el.clientWidth)
      requestAnimationFrame(() => setWidth(el.clientWidth))
    }
  }, [])
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref: setRef, width }
}
