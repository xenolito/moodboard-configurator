import { useState, useEffect } from 'react'

const drawLayer = (d, r, g, b, alpha) => {
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] < 128) {
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = alpha
    } else {
      d[i + 3] = 0
    }
  }
}

const drawStroke = (d, width, height, r, g, b, alpha, strokeWidth) => {
  const total = width * height

  // Step 1: mark edge pixels (black pixels with at least one white neighbor)
  const edge = new Uint8Array(total)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pi = y * width + x
      if (d[pi * 4] >= 128) continue
      if (
        (x > 0        && d[(pi - 1) * 4]     >= 128) ||
        (x < width-1  && d[(pi + 1) * 4]     >= 128) ||
        (y > 0        && d[(pi - width) * 4] >= 128) ||
        (y < height-1 && d[(pi + width) * 4] >= 128)
      ) edge[pi] = 1
    }
  }

  // Step 2: dilate edge outward using separable passes (horizontal then vertical)
  const dilH = new Uint8Array(total)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!edge[y * width + x]) continue
      const x0 = Math.max(0, x - strokeWidth)
      const x1 = Math.min(width - 1, x + strokeWidth)
      for (let nx = x0; nx <= x1; nx++) dilH[y * width + nx] = 1
    }
  }

  const dilV = new Uint8Array(total)
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (!dilH[y * width + x]) continue
      const y0 = Math.max(0, y - strokeWidth)
      const y1 = Math.min(height - 1, y + strokeWidth)
      for (let ny = y0; ny <= y1; ny++) dilV[ny * width + x] = 1
    }
  }

  // Step 3: paint only white pixels inside the dilated zone (outside the clickable area)
  for (let i = 0; i < d.length; i += 4) {
    const pi = i / 4
    if (dilV[pi] && d[i] >= 128) {
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = alpha
    } else {
      d[i + 3] = 0
    }
  }
}

export const useZoneHintMask = (maskUrl, tintHex, opacity = 0.7, type = 'layer', strokeWidth = 3) => {
  const [hintSrc, setHintSrc] = useState(null)

  useEffect(() => {
    if (!maskUrl || !tintHex) { setHintSrc(null); return }

    let cancelled = false
    let blobUrl   = null

    const hex   = tintHex.replace('#', '')
    const r     = parseInt(hex.slice(0, 2), 16)
    const g     = parseInt(hex.slice(2, 4), 16)
    const b     = parseInt(hex.slice(4, 6), 16)
    const alpha = Math.round(opacity * 255)

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

      if (type === 'stroke') {
        drawStroke(d, canvas.width, canvas.height, r, g, b, alpha, strokeWidth)
      } else {
        drawLayer(d, r, g, b, alpha)
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
  }, [maskUrl, tintHex, opacity, type, strokeWidth])

  return hintSrc
}
