import { useState, useEffect } from 'react'

export const useZoneHintMask = (maskUrl, tintHex, opacity = 0.7) => {
  const [hintSrc, setHintSrc] = useState(null)

  useEffect(() => {
    if (!maskUrl || !tintHex) { setHintSrc(null); return }

    let cancelled = false
    let blobUrl   = null

    const hex = tintHex.replace('#', '')
    const r   = parseInt(hex.slice(0, 2), 16)
    const g   = parseInt(hex.slice(2, 4), 16)
    const b   = parseInt(hex.slice(4, 6), 16)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (cancelled) return
      const canvas = document.createElement('canvas')
      canvas.width  = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imageData.data
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] < 128) {     // black pixel = clickable zone → apply tint
          d[i]     = r
          d[i + 1] = g
          d[i + 2] = b
          d[i + 3] = Math.round(opacity * 255)
        } else {              // white pixel = non-clickable → transparent
          d[i + 3] = 0
        }
      }
      ctx.putImageData(imageData, 0, 0)
      canvas.toBlob(blob => {
        if (cancelled) return
        blobUrl = URL.createObjectURL(blob)
        setHintSrc(blobUrl)
      })
    }
    img.src = maskUrl

    return () => {
      cancelled = true
      if (blobUrl) URL.revokeObjectURL(blobUrl)
      setHintSrc(null)
    }
  }, [maskUrl, tintHex, opacity])

  return hintSrc
}
