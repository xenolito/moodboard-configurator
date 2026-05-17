const loadBitmap = async (url) => {
  const resp = await fetch(url)
  const blob = await resp.blob()
  return createImageBitmap(blob)
}

const makeCanvas = (w, h) => {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

const canvasToBlob = (canvas, type, quality) =>
  canvas instanceof OffscreenCanvas
    ? canvas.convertToBlob({ type, quality })
    : new Promise(res => canvas.toBlob(res, type, quality))

export const buildCompareComposite = async (leftUrl, rightUrl, sliderXPct) => {
  const [leftImg, rightImg] = await Promise.all([
    loadBitmap(leftUrl),
    loadBitmap(rightUrl)
  ])

  const w = leftImg.width
  const h = leftImg.height
  const splitX = Math.round(w * sliderXPct)

  const canvas = makeCanvas(w, h)
  const ctx = canvas.getContext('2d')

  ctx.drawImage(leftImg, 0, 0, w, h)

  ctx.save()
  ctx.beginPath()
  ctx.rect(splitX, 0, w - splitX, h)
  ctx.clip()
  ctx.drawImage(rightImg, 0, 0, w, h)
  ctx.restore()

  // Handler line: white with dark shadow for visibility on any background
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
  ctx.shadowBlur = 6
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(splitX, 0)
  ctx.lineTo(splitX, h)
  ctx.stroke()

  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92)
  return URL.createObjectURL(blob)
}
