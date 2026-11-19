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
  return ''
}

const buildCompareTexts = (infoData) => {
  const fmt = (e) => [e.modelName, e.variantLabel].filter(Boolean).join(' — ')
  const fmtSide = (side) => (Array.isArray(side) ? side.map(fmt).join(' · ') : fmt(side))
  return { leftText: fmtSide(infoData.left), rightText: fmtSide(infoData.right) }
}

// Draws a black rounded badge with white label text. Returns x after the badge.
const drawBadge = (doc, label, x, baselineY) => {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  const padH = 1, badgeH = 3.4, yTop = baselineY - 2.8
  const tw = doc.getTextWidth(label)
  const bw = tw + padH * 2
  doc.setFillColor(0, 0, 0)
  doc.roundedRect(x, yTop, bw, badgeH, 0.5, 0.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text(label, x + padH, baselineY)
  return x + bw + 2
}

const drawPageFooter = (doc, branding, ML, PW, MR, footerY) => {
  doc.setDrawColor(210, 210, 210)
  doc.setLineWidth(0.25)
  doc.line(ML, footerY - 2, PW - MR, footerY - 2)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  const contactParts = [branding?.siteUrl, branding?.contactEmail].filter(Boolean)
  if (contactParts.length) {
    doc.text(contactParts.join('  ·  '), PW - MR, footerY + 4, { align: 'right' })
  }
}

const drawPageHeader = (doc, logoResult, branding, infoData, ML, MT, HEADER_H, PW, MR) => {
  if (logoResult?.dataUrl) {
    const aspect = logoResult.aspect ?? 3
    const maxLogoW = 55
    let logoW = HEADER_H * aspect
    let logoH = HEADER_H
    if (logoW > maxLogoW) { logoW = maxLogoW; logoH = maxLogoW / aspect }
    doc.addImage(logoResult.dataUrl, 'PNG', ML, MT, logoW, logoH)
  }

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

  doc.setDrawColor(210, 210, 210)
  doc.setLineWidth(0.25)
  doc.line(ML, MT + HEADER_H + 1, PW - MR, MT + HEADER_H + 1)
}

export const usePdfDownload = () => {
  const downloadPdf = useCallback(async ({ renderUrl, ambientId, infoData, branding, logoUrl, targetTab = null }) => {
    if (!renderUrl) return

    const { jsPDF } = await import('jspdf')

    const [renderResult, logoResult] = await Promise.all([
      renderUrlToJpeg(renderUrl),
      logoUrl ? svgUrlToPng(logoUrl).catch(() => null) : Promise.resolve(null)
    ])

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    const pdfTitle = [branding?.title, infoData?.ambientName].filter(Boolean).join(' — ')
    doc.setProperties({ title: pdfTitle })

    const PW = 297, PH = 210
    const ML = 12, MR = 12, MT = 10, MB = 10
    const CW = PW - ML - MR
    const HEADER_H = 14, GAP1 = 4, GAP2 = 4, FOOTER_H = 8
    const imgY = MT + HEADER_H + GAP1
    const imgMaxH = PH - imgY - GAP2 - FOOTER_H - MB
    const footerY = PH - MB - FOOTER_H

    const type = infoData?.type
    const isMultiZone = type === 'combined' || type === 'compare-combined'
    const isCompare = type === 'compare' || type === 'compare-combined'

    // --- PAGE 1 ---
    drawPageHeader(doc, logoResult, branding, infoData, ML, MT, HEADER_H, PW, MR)

    const imgAspect = renderResult.height / renderResult.width
    let imgW = CW
    let imgH = imgW * imgAspect
    if (imgH > imgMaxH) { imgH = imgMaxH; imgW = imgH / imgAspect }
    const imgX = ML + (CW - imgW) / 2
    doc.addImage(renderResult.dataUrl, 'JPEG', imgX, imgY, imgW, imgH)

    if (isMultiZone) {
      // Multi-zone: page 1 has only the URL/email footer; product info goes to page 2
      drawPageFooter(doc, branding, ML, PW, MR, footerY)
    } else if (type === 'compare') {
      // Single-zone compare: inline badges in the footer
      const { leftText, rightText } = buildCompareTexts(infoData)
      doc.setDrawColor(210, 210, 210)
      doc.setLineWidth(0.25)
      doc.line(ML, footerY - 2, PW - MR, footerY - 2)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const textY = footerY + 4
      let x = ML
      x = drawBadge(doc, 'IZQUIERDA', x, textY)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(60, 60, 60)
      doc.text(leftText, x, textY)
      x += doc.getTextWidth(leftText) + 4
      doc.setTextColor(190, 190, 190)
      doc.text('|', x, textY)
      x += doc.getTextWidth('|') + 4
      x = drawBadge(doc, 'DERECHA', x, textY)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(60, 60, 60)
      doc.text(rightText, x, textY)
      doc.setTextColor(100, 100, 100)
      const contactParts = [branding?.siteUrl, branding?.contactEmail].filter(Boolean)
      if (contactParts.length) {
        doc.text(contactParts.join('  ·  '), PW - MR, textY, { align: 'right' })
      }
    } else {
      // single: footer with product info + URL/email
      doc.setDrawColor(210, 210, 210)
      doc.setLineWidth(0.25)
      doc.line(ML, footerY - 2, PW - MR, footerY - 2)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      const footerMain = buildFooterText(infoData)
      if (footerMain) doc.text(footerMain, ML, footerY + 4)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      const contactParts = [branding?.siteUrl, branding?.contactEmail].filter(Boolean)
      if (contactParts.length) {
        doc.text(contactParts.join('  ·  '), PW - MR, footerY + 4, { align: 'right' })
      }
    }

    // --- PAGE 2: product info (multi-zone only) ---
    if (isMultiZone) {
      doc.addPage()
      drawPageHeader(doc, logoResult, branding, infoData, ML, MT, HEADER_H, PW, MR)

      const fmt = (e) => [e.modelName, e.variantLabel].filter(Boolean).join(' — ')
      const contentStartY = MT + HEADER_H + GAP1 + 4
      const titleBaselineY = contentStartY + 12
      const columnsStartY = titleBaselineY + 16
      const zonesStartY = columnsStartY + 9
      const lineH = 8

      // Title
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(40, 40, 40)
      doc.text('Tus productos', ML, titleBaselineY)

      if (type === 'combined') {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(60, 60, 60)
        infoData.zones.forEach((zone, i) => {
          doc.text(`· ${fmt(zone)}`, ML, zonesStartY + i * lineH)
        })
      } else if (type === 'compare-combined') {
        const colW = CW / 2
        const colGap = 8
        const col2X = ML + colW + colGap
        const leftZones = Array.isArray(infoData.left) ? infoData.left : [infoData.left]
        const rightZones = Array.isArray(infoData.right) ? infoData.right : [infoData.right]

        // Vertical separator — height matches the taller column
        const sepBottom = zonesStartY + (Math.max(leftZones.length, rightZones.length) - 1) * lineH + 6
        doc.setDrawColor(210, 210, 210)
        doc.setLineWidth(0.3)
        doc.line(ML + colW, columnsStartY - 6, ML + colW, sepBottom)

        // Left column
        drawBadge(doc, 'IZQUIERDA', ML, columnsStartY)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(60, 60, 60)
        leftZones.forEach((zone, i) => {
          doc.text(`· ${fmt(zone)}`, ML + 3, zonesStartY + i * lineH)
        })

        // Right column
        drawBadge(doc, 'DERECHA', col2X, columnsStartY)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(60, 60, 60)
        rightZones.forEach((zone, i) => {
          doc.text(`· ${fmt(zone)}`, col2X + 3, zonesStartY + i * lineH)
        })
      }

      drawPageFooter(doc, branding, ML, PW, MR, footerY)
    }

    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    if (targetTab) {
      targetTab.location.href = url
    } else {
      window.open(url, '_blank', 'noopener')
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }, [])

  return { downloadPdf }
}
