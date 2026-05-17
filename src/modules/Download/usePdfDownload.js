import { useCallback } from 'react'

const blobToDataUrl = (blob) => new Promise((resolve) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.readAsDataURL(blob)
})

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

const renderUrlToJpeg = async (url) => {
  const resp = await fetch(url)
  const blob = await resp.blob()
  const bitmap = await createImageBitmap(blob)
  const canvas = makeCanvas(bitmap.width, bitmap.height)
  canvas.getContext('2d').drawImage(bitmap, 0, 0)
  const outBlob = await canvasToBlob(canvas, 'image/jpeg', 0.92)
  return { dataUrl: await blobToDataUrl(outBlob), width: bitmap.width, height: bitmap.height }
}

const svgUrlToPng = async (url) => {
  const resp = await fetch(url)
  const svgText = await resp.text()
  const blob = new Blob([svgText], { type: 'image/svg+xml' })
  const objectUrl = URL.createObjectURL(blob)
  try {
    const img = new Image()
    img.src = objectUrl
    await img.decode()
    const naturalW = img.naturalWidth || 400
    const naturalH = img.naturalHeight || 120
    const canvas = makeCanvas(naturalW, naturalH)
    canvas.getContext('2d').drawImage(img, 0, 0, naturalW, naturalH)
    const pngBlob = await canvasToBlob(canvas, 'image/png', 1)
    return { dataUrl: await blobToDataUrl(pngBlob), aspect: naturalW / naturalH }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

const buildFooterText = (infoData) => {
  if (!infoData) return ''
  const fmt = (e) => [e.modelName, e.variantLabel].filter(Boolean).join(' — ')
  if (infoData.type === 'single') return fmt(infoData)
  if (infoData.type === 'combined') return infoData.zones.map(fmt).join('  ·  ')
  if (infoData.type === 'compare') {
    const fmtSide = (side) => (Array.isArray(side) ? side.map(fmt).join(' · ') : fmt(side))
    return `Antes: ${fmtSide(infoData.left)}  |  Después: ${fmtSide(infoData.right)}`
  }
  if (infoData.type === 'compare-combined') {
    const right = Array.isArray(infoData.right) ? infoData.right.map(fmt).join(' · ') : fmt(infoData.right)
    return `Después: ${right}`
  }
  return ''
}

export const usePdfDownload = () => {
  const downloadPdf = useCallback(async ({ renderUrl, ambientId, infoData, branding, logoUrl }) => {
    if (!renderUrl) return

    const { jsPDF } = await import('jspdf')

    const [renderResult, logoResult] = await Promise.all([
      renderUrlToJpeg(renderUrl),
      logoUrl ? svgUrlToPng(logoUrl).catch(() => null) : Promise.resolve(null)
    ])

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    const PW = 297, PH = 210
    const ML = 12, MR = 12, MT = 10, MB = 10
    const CW = PW - ML - MR
    const HEADER_H = 14, GAP1 = 4, GAP2 = 4, FOOTER_H = 8
    const imgY = MT + HEADER_H + GAP1
    const imgMaxH = PH - imgY - GAP2 - FOOTER_H - MB
    const footerY = PH - MB - FOOTER_H

    // Logo
    if (logoResult?.dataUrl) {
      const aspect = logoResult.aspect ?? 3
      const maxLogoW = 55
      let logoW = HEADER_H * aspect
      let logoH = HEADER_H
      if (logoW > maxLogoW) { logoW = maxLogoW; logoH = maxLogoW / aspect }
      doc.addImage(logoResult.dataUrl, 'PNG', ML, MT, logoW, logoH)
    }

    // Title + ambient name (right aligned)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(40, 40, 40)
    doc.text(branding?.title ?? '', PW - MR, MT + 5, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(110, 110, 110)
    if (infoData?.ambientName) {
      doc.text(infoData.ambientName, PW - MR, MT + 11, { align: 'right' })
    }

    // Header separator
    doc.setDrawColor(210, 210, 210)
    doc.setLineWidth(0.25)
    doc.line(ML, MT + HEADER_H + 1, PW - MR, MT + HEADER_H + 1)

    // Render image (maintain aspect ratio, centered horizontally)
    const aspect = renderResult.height / renderResult.width
    let imgW = CW
    let imgH = imgW * aspect
    if (imgH > imgMaxH) { imgH = imgMaxH; imgW = imgH / aspect }
    const imgX = ML + (CW - imgW) / 2
    doc.addImage(renderResult.dataUrl, 'JPEG', imgX, imgY, imgW, imgH)

    // Footer separator
    doc.setDrawColor(210, 210, 210)
    doc.line(ML, footerY - 2, PW - MR, footerY - 2)

    // Footer: model info (left) + contact (right)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(60, 60, 60)
    const footerMain = buildFooterText(infoData)
    if (footerMain) doc.text(footerMain, ML, footerY + 4)

    doc.setTextColor(100, 100, 100)
    const contactParts = [branding?.siteUrl, branding?.contactEmail].filter(Boolean)
    if (contactParts.length) {
      doc.text(contactParts.join('  ·  '), PW - MR, footerY + 4, { align: 'right' })
    }

    doc.save(`prefabricados-duero-${ambientId}.pdf`)
  }, [])

  return { downloadPdf }
}
