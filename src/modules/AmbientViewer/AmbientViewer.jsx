import { useRef, useCallback, useState, useEffect } from 'react'
import { SplitSquareHorizontal, Download } from 'lucide-react'
import { useMaskDetection } from '../../hooks/useMaskDetection.js'
import { useDownload } from '../Download/useDownload.js'
import BeforeAfterSlider from '../Slider/BeforeAfterSlider.jsx'
import IconButton from '../../ui/IconButton.jsx'
import { buildBasePath, buildMaskPath } from '../../utils/buildPaths.js'
import { useZoneHintMask } from '../../hooks/useZoneHintMask.js'

const AmbientViewer = ({
  ambient,
  panelPosition = 'right',
  panelOpen = false,
  renderUrl,
  renderLoading,
  onZoneClick,
  onOutsideZoneClick,
  onSliderChange,
  children
}) => {
  const containerRef       = useRef(null)
  const hintTimerRef       = useRef(null)
  const autoHintIntervalRef = useRef(null)
  const autoHintDoneRef    = useRef(false)
  const [sliderActive, setSliderActive]       = useState(false)
  useEffect(() => { onSliderChange?.(sliderActive) }, [sliderActive, onSliderChange])
  const [baseDisplayUrl, setBaseDisplayUrl]   = useState(null)
  const [selectedUrl, setSelectedUrl]         = useState(null)
  const [incomingUrl, setIncomingUrl]         = useState(null)
  const [incomingVisible, setIncomingVisible] = useState(false)
  const [hintActive, setHintActive]           = useState(false)
  const zone     = ambient?.zones?.[0]
  const maskUrl  = zone ? buildMaskPath(ambient.id, zone.mask) : null
  const hintSrc  = useZoneHintMask(
    maskUrl,
    zone?.hintZone?.color       ?? 'ffffff',
    zone?.hintZone?.opacity     ?? 0.7,
    zone?.hintZone?.type        ?? 'layer',
    zone?.hintZone?.strokeWidth ?? 3
  )
  const { getZoneAtPoint } = useMaskDetection(zone?.mask)
  const { download } = useDownload()

  useEffect(() => {
    if (renderUrl) {
      setIncomingUrl(renderUrl)
      setIncomingVisible(false)
      let inner
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setIncomingVisible(true))
      })
      return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner) }
    }
    if (!renderLoading) {
      setBaseDisplayUrl(null)
      setSelectedUrl(null)
      setIncomingUrl(null)
      setIncomingVisible(false)
      setSliderActive(false)
      setHintActive(false)
    }
  }, [renderUrl, renderLoading])

  const handleIncomingEnd = useCallback((e) => {
    if (e.propertyName !== 'opacity') return
    if (selectedUrl) setBaseDisplayUrl(selectedUrl)
    setSelectedUrl(incomingUrl)
    setIncomingUrl(null)
    setIncomingVisible(false)
  }, [incomingUrl, selectedUrl])

  const handleMouseMove = useCallback((e) => {
    if (!zone || sliderActive) return
    const zoneId = getZoneAtPoint(e.clientX, e.clientY, containerRef.current, ambient.zones)
    containerRef.current.style.cursor = zoneId ? 'pointer' : 'default'
  }, [ambient, zone, sliderActive, getZoneAtPoint])

  const handleClick = useCallback((e) => {
    if (!zone || sliderActive) return
    const zoneId = getZoneAtPoint(e.clientX, e.clientY, containerRef.current, ambient.zones)
    if (zoneId) {
      autoHintDoneRef.current = true
      clearInterval(autoHintIntervalRef.current)
      autoHintIntervalRef.current = null
      onZoneClick?.(zoneId)
    } else if (onOutsideZoneClick && panelOpen) {
      onOutsideZoneClick()
    } else {
      setHintActive(true)
      clearTimeout(hintTimerRef.current)
      hintTimerRef.current = setTimeout(() => setHintActive(false), zone?.hintZone?.animationTime ?? 500)
    }
  }, [ambient, zone, sliderActive, panelOpen, getZoneAtPoint, onZoneClick, onOutsideZoneClick])

  useEffect(() => () => clearTimeout(hintTimerRef.current), [])

  useEffect(() => {
    autoHintDoneRef.current = false
    clearInterval(autoHintIntervalRef.current)
    autoHintIntervalRef.current = null

    const timeToShow = ambient?.autoHint?.timeToShow
    if (!timeToShow || !hintSrc || (ambient?.zones?.length ?? 0) <= 1) return

    const delayMs = timeToShow * 1000
    autoHintIntervalRef.current = setInterval(() => {
      if (autoHintDoneRef.current) return
      setHintActive(true)
      clearTimeout(hintTimerRef.current)
      hintTimerRef.current = setTimeout(
        () => setHintActive(false),
        zone?.hintZone?.animationTime ?? 500
      )
    }, delayMs)

    return () => {
      clearInterval(autoHintIntervalRef.current)
      autoHintIntervalRef.current = null
    }
  }, [ambient?.id, ambient?.autoHint?.timeToShow, hintSrc])

  const handleMouseLeave = useCallback(() => {
    if (containerRef.current) containerRef.current.style.cursor = 'default'
  }, [])

  if (!ambient) return null

  const originalBaseUrl  = buildBasePath(ambient.id)
  const effectiveBaseUrl = baseDisplayUrl || originalBaseUrl

  return (
    <div
      className={`ambient-viewer${sliderActive ? ' slider-active' : ''}${panelPosition === 'left' ? ' actions-right' : ''}`}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseLeave={handleMouseLeave}
    >
      <img
        className="ambient-base"
        src={effectiveBaseUrl}
        alt={ambient.name}
        draggable={false}
      />

      {selectedUrl && (
        <img
          key={selectedUrl}
          className={`ambient-selected-render is-loaded${sliderActive ? ' slider-split' : ''}`}
          src={selectedUrl}
          alt=""
          draggable={false}
        />
      )}
      {incomingUrl && !sliderActive && (
        <img
          key={incomingUrl}
          className={`ambient-selected-render${incomingVisible ? ' is-loaded' : ''}`}
          src={incomingUrl}
          alt=""
          draggable={false}
          onTransitionEnd={handleIncomingEnd}
        />
      )}

      {hintSrc && (
        <img
          className={`zone-hint${hintActive ? ' is-active' : ''}`}
          src={hintSrc}
          alt=""
          draggable={false}
        />
      )}

      {sliderActive && (
        <BeforeAfterSlider containerRef={containerRef} />
      )}

      <div className="ambient-actions">
        <IconButton
          icon={SplitSquareHorizontal}
          label={sliderActive ? 'Ocultar comparativa' : 'Comparar antes/después'}
          active={sliderActive}
          onClick={(e) => { e.stopPropagation(); setSliderActive(v => !v) }}
        />
        <IconButton
          icon={Download}
          label="Descargar imagen"
          onClick={(e) => { e.stopPropagation(); download(selectedUrl || effectiveBaseUrl, ambient.id) }}
        />
      </div>

      {children}
    </div>
  )
}

export default AmbientViewer
