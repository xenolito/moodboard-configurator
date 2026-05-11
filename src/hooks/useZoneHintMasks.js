import { useState, useEffect } from 'react'

const TOLERANCE = 32

const isZonePixel = (d, i, [mr, mg, mb]) =>
  Math.abs(d[i]     - mr) < TOLERANCE &&
  Math.abs(d[i + 1] - mg) < TOLERANCE &&
  Math.abs(d[i + 2] - mb) < TOLERANCE

const drawLayer = (d, maskColor, r, g, b, alpha) => {
  for (let i = 0; i < d.length; i += 4) {
    if (isZonePixel(d, i, maskColor)) {
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = alpha
    } else {
      d[i + 3] = 0
    }
  }
}

const drawStroke = (d, width, height, maskColor, r, g, b, alpha, strokeWidth) => {
  const total = width * height

  const edge = new Uint8Array(total)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pi = y * width + x
      if (!isZonePixel(d, pi * 4, maskColor)) continue
      if (
        (x > 0        && !isZonePixel(d, (pi - 1) * 4,     maskColor)) ||
        (x < width-1  && !isZonePixel(d, (pi + 1) * 4,     maskColor)) ||
        (y > 0        && !isZonePixel(d, (pi - width) * 4, maskColor)) ||
        (y < height-1 && !isZonePixel(d, (pi + width) * 4, maskColor))
      ) edge[pi] = 1
    }
  }

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

  for (let i = 0; i < d.length; i += 4) {
    const pi = i / 4
    if (dilV[pi] && !isZonePixel(d, i, maskColor)) {
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = alpha
    } else {
      d[i + 3] = 0
    }
  }
}

export const useZoneHintMasks = (maskPath, zones) => {
  const [hintSrcs, setHintSrcs] = useState([])

  useEffect(() => {
    if (!maskPath || !zones?.length) { setHintSrcs([]); return }

    let cancelled = false
    const blobUrls = []

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (cancelled) return

      const pending = zones.map(zone => new Promise(resolve => {
        const canvas = document.createElement('canvas')
        canvas.width  = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const d = imageData.data

        const hex   = (zone.hintZone?.color ?? 'ffffff').replace('#', '')
        const r     = parseInt(hex.slice(0, 2), 16)
        const g     = parseInt(hex.slice(2, 4), 16)
        const b     = parseInt(hex.slice(4, 6), 16)
        const alpha = Math.round((zone.hintZone?.opacity ?? 0.7) * 255)
        const type  = zone.hintZone?.type ?? 'layer'
        const sw    = zone.hintZone?.strokeWidth ?? 3
        const mc    = zone.maskColor ?? [0, 0, 0]

        if (type === 'stroke') {
          drawStroke(d, canvas.width, canvas.height, mc, r, g, b, alpha, sw)
        } else if (type === 'invert') {
          drawLayer(d, mc, 255, 255, 255, 255)
        } else {
          drawLayer(d, mc, r, g, b, alpha)
        }

        ctx.putImageData(imageData, 0, 0)
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob)
          blobUrls.push(url)
          resolve(url)
        })
      }))

      Promise.all(pending).then(srcs => {
        if (!cancelled) setHintSrcs(srcs)
      })
    }
    img.src = maskPath

    return () => {
      cancelled = true
      blobUrls.forEach(u => URL.revokeObjectURL(u))
      setHintSrcs([])
    }
  }, [maskPath, zones])

  return hintSrcs
}
