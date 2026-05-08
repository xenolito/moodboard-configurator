import { useEffect, useRef, useCallback } from 'react'
import { getBaseUrl } from '../utils/baseUrl.js'
import { isColorMatch } from '../utils/colorUtils.js'

export const useMaskDetection = (maskPath) => {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const sizeRef = useRef({ w: 0, h: 0 })

  useEffect(() => {
    if (!maskPath) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(img, 0, 0)
      canvasRef.current = canvas
      ctxRef.current    = ctx
      sizeRef.current   = { w: img.naturalWidth, h: img.naturalHeight }
    }
    img.src = `${getBaseUrl()}${maskPath}`
  }, [maskPath])

  const getZoneAtPoint = useCallback((clientX, clientY, containerEl, zones) => {
    if (!ctxRef.current || !containerEl) return null
    const rect = containerEl.getBoundingClientRect()
    const relX = clientX - rect.left
    const relY = clientY - rect.top
    const maskX = Math.round((relX / rect.width)  * sizeRef.current.w)
    const maskY = Math.round((relY / rect.height) * sizeRef.current.h)
    if (maskX < 0 || maskY < 0 || maskX >= sizeRef.current.w || maskY >= sizeRef.current.h) return null
    const [r, g, b] = ctxRef.current.getImageData(maskX, maskY, 1, 1).data
    for (const zone of zones) {
      if (isColorMatch(r, g, b, zone.maskColor)) return zone.id
    }
    return null
  }, [])

  return { getZoneAtPoint }
}
