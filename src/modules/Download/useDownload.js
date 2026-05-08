import { useCallback } from 'react'
import isIOSSafari from '../../utils/isIOSSafari.js'

const loadBitmap = async (url) => {
  const resp = await fetch(url)
  const blob = await resp.blob()
  return createImageBitmap(blob)
}

const triggerDownload = (url, filename) => {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

export const useDownload = () => {
  const download = useCallback(async (renderUrl, ambientId) => {
    if (!renderUrl) return

    const filename = `prefabricados-duero-${ambientId}-${Date.now()}.jpg`

    try {
      if (typeof OffscreenCanvas !== 'undefined' && !isIOSSafari()) {
        const img = await loadBitmap(renderUrl)
        const canvas = new OffscreenCanvas(img.width, img.height)
        canvas.getContext('2d').drawImage(img, 0, 0)
        const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 })
        const url = URL.createObjectURL(blob)
        triggerDownload(url, filename)
        setTimeout(() => URL.revokeObjectURL(url), 10000)
      } else {
        // Fallback iOS Safari
        const img = await loadBitmap(renderUrl)
        const canvas = document.createElement('canvas')
        canvas.width  = img.width
        canvas.height = img.height
        canvas.getContext('2d').drawImage(img, 0, 0)
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          triggerDownload(url, filename)
          setTimeout(() => URL.revokeObjectURL(url), 10000)
        }, 'image/jpeg', 0.92)
      }
    } catch {
      // Fallback final: descarga directa de la URL del render
      triggerDownload(renderUrl, filename)
    }
  }, [])

  return { download }
}
