import { useRef, useCallback, useEffect } from 'react'

export const useBeforeAfter = (containerRef) => {
  const isDragging = useRef(false)

  const updateX = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    containerRef.current.style.setProperty('--slider-x', `${x * 100}%`)
  }, [containerRef])

  const onPointerDown = useCallback((e) => {
    isDragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    document.body.style.touchAction = 'none'
    updateX(e)
  }, [updateX])

  const onPointerMove = useCallback((e) => {
    if (!isDragging.current) return
    updateX(e)
  }, [updateX])

  const onPointerUp = useCallback(() => {
    isDragging.current = false
    document.body.style.touchAction = ''
  }, [])

  useEffect(() => () => { document.body.style.touchAction = '' }, [])

  return {
    sliderHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp }
  }
}
