import { useState, useEffect } from 'react'
import { buildRenderPath } from '../utils/buildPaths.js'

export const useRenderLoader = (ambientId, modelId, variantId, explicitUrl = null) => {
  const [loadedUrl, setLoadedUrl] = useState(null)
  const [errorUrl, setErrorUrl]   = useState(null)

  const expectedUrl = explicitUrl ?? ((ambientId && modelId && variantId)
    ? buildRenderPath(ambientId, modelId, variantId)
    : null)

  useEffect(() => {
    if (!expectedUrl) return
    let cancelled = false
    const img = new Image()
    img.onload  = () => { if (!cancelled) setLoadedUrl(expectedUrl) }
    img.onerror = () => {
      if (!cancelled) {
        console.warn(`[useRenderLoader] Render not found: ${expectedUrl}`)
        setErrorUrl(expectedUrl)
      }
    }
    img.src = expectedUrl
    return () => { cancelled = true }
  }, [expectedUrl])

  const isReady   = loadedUrl === expectedUrl
  const isLoading = !!expectedUrl && !isReady && errorUrl !== expectedUrl

  return {
    url:     isReady ? expectedUrl : null,
    loading: isLoading,
    error:   errorUrl === expectedUrl ? `No se pudo cargar: ${expectedUrl}` : null
  }
}
