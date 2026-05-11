import { useRef, useCallback, useState, useEffect } from 'react'
import { SplitSquareHorizontal, Download, ArrowLeft } from 'lucide-react'
import { useMaskDetection } from '../../hooks/useMaskDetection.js'
import { useDownload } from '../Download/useDownload.js'
import BeforeAfterSlider from '../Slider/BeforeAfterSlider.jsx'
import IconButton from '../../ui/IconButton.jsx'
import { buildBasePath, buildMaskPath } from '../../utils/buildPaths.js'
import { useZoneHintMasks } from '../../hooks/useZoneHintMasks.js'

const AmbientViewer = ({
  ambient,
  panelPosition = 'right',
  panelOpen = false,
  renderUrl,
  renderLoading,
  compareLeftUrl,
  hasBaseRender = false,
  backUrl,
  autoHintStopped = false,
  onZoneClick,
  onOutsideZoneClick,
  onCompareSlotClick,
  onSliderChange,
  children
}) => {
  const containerRef        = useRef(null)
  const hintSeqTimerRef     = useRef(null)
  const autoHintIntervalRef = useRef(null)
  const autoHintDoneRef     = useRef(false)
  const [sliderActive, setSliderActive]       = useState(false)
  const sliderActiveRef = useRef(false)
  sliderActiveRef.current = sliderActive
  useEffect(() => { onSliderChange?.(sliderActive) }, [sliderActive, onSliderChange])
  const [baseDisplayUrl, setBaseDisplayUrl]   = useState(null)
  const [selectedUrl, setSelectedUrl]         = useState(null)
  const [incomingUrl, setIncomingUrl]         = useState(null)
  const [incomingVisible, setIncomingVisible] = useState(false)
  const [hintZoneIdx, setHintZoneIdx]         = useState(null)
  const zone     = ambient?.zones?.[0]
  const maskUrl  = ambient?.mask ? buildMaskPath(ambient.id, ambient.mask) : null
  const hintSrcs = useZoneHintMasks(maskUrl, ambient?.zones ?? [])
  const { getZoneAtPoint } = useMaskDetection(ambient?.mask ?? null)
  const { download } = useDownload()

  useEffect(() => {
    if (renderUrl) {
      if (sliderActiveRef.current) {
        setSelectedUrl(renderUrl)
        setIncomingUrl(null)
        setIncomingVisible(false)
        return
      }
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
      setHintZoneIdx(null)
    }
  }, [renderUrl, renderLoading])

  const handleIncomingEnd = useCallback((e) => {
    if (e.propertyName !== 'opacity') return
    if (selectedUrl) setBaseDisplayUrl(selectedUrl)
    setSelectedUrl(incomingUrl)
    setIncomingUrl(null)
    setIncomingVisible(false)
  }, [incomingUrl, selectedUrl])

  const runHintSequence = useCallback((onEnd) => {
    clearTimeout(hintSeqTimerRef.current)
    const zones = ambient?.zones ?? []
    const sequenceDelay = ambient?.hintSequenceDelay ?? 300
    let idx = 0
    const showNext = () => {
      if (idx >= zones.length) return
      setHintZoneIdx(idx)
      const animTime = zones[idx].hintZone?.animationTime ?? 500
      hintSeqTimerRef.current = setTimeout(() => {
        setHintZoneIdx(null)
        if (idx + 1 < zones.length) {
          idx++
          hintSeqTimerRef.current = setTimeout(showNext, sequenceDelay)
        } else {
          onEnd?.()
        }
      }, animTime)
    }
    showNext()
  }, [ambient])

  const handleMouseMove = useCallback((e) => {
    if (!zone) return
    const zoneId = getZoneAtPoint(e.clientX, e.clientY, containerRef.current, ambient.zones)
    containerRef.current.style.cursor = zoneId ? 'pointer' : 'default'
  }, [ambient, zone, getZoneAtPoint])

  const handleClick = useCallback((e) => {
    if (!zone) return
    const zoneId = getZoneAtPoint(e.clientX, e.clientY, containerRef.current, ambient.zones)
    if (sliderActive) {
      if (zoneId) {
        const rect = containerRef.current.getBoundingClientRect()
        const sliderXStr = containerRef.current.style.getPropertyValue('--slider-x') || '50%'
        const sliderXPct = parseFloat(sliderXStr) / 100
        const relXPct = (e.clientX - rect.left) / rect.width
        onCompareSlotClick?.(relXPct < sliderXPct ? 'left' : 'right')
        autoHintDoneRef.current = true
        clearInterval(autoHintIntervalRef.current)
        autoHintIntervalRef.current = null
        onZoneClick?.(zoneId)
      } else {
        onOutsideZoneClick?.()
      }
      return
    }
    if (zoneId) {
      autoHintDoneRef.current = true
      clearInterval(autoHintIntervalRef.current)
      autoHintIntervalRef.current = null
      onZoneClick?.(zoneId)
    } else if (onOutsideZoneClick && panelOpen) {
      onOutsideZoneClick()
    } else {
      clearInterval(autoHintIntervalRef.current)
      autoHintIntervalRef.current = null
      const timeToShow = ambient?.autoHint?.timeToShow
      runHintSequence(timeToShow ? () => {
        if (autoHintDoneRef.current) return
        const delayMs = timeToShow * 1000
        autoHintIntervalRef.current = setInterval(() => {
          if (autoHintDoneRef.current) return
          runHintSequence()
        }, delayMs)
      } : undefined)
    }
  }, [ambient, zone, sliderActive, panelOpen, getZoneAtPoint, onZoneClick, onOutsideZoneClick, onCompareSlotClick, runHintSequence])

  useEffect(() => () => clearTimeout(hintSeqTimerRef.current), [])

  useEffect(() => {
    if (!autoHintStopped) return
    autoHintDoneRef.current = true
    clearInterval(autoHintIntervalRef.current)
    autoHintIntervalRef.current = null
  }, [autoHintStopped])

  useEffect(() => {
    autoHintDoneRef.current = false
    clearInterval(autoHintIntervalRef.current)
    clearTimeout(hintSeqTimerRef.current)
    autoHintIntervalRef.current = null
    setHintZoneIdx(null)

    const timeToShow = ambient?.autoHint?.timeToShow
    if (!timeToShow || !hintSrcs.length) return

    const delayMs = timeToShow * 1000
    autoHintIntervalRef.current = setInterval(() => {
      if (autoHintDoneRef.current) return
      runHintSequence()
    }, delayMs)

    return () => {
      clearInterval(autoHintIntervalRef.current)
      autoHintIntervalRef.current = null
    }
  }, [ambient?.id, ambient?.autoHint?.timeToShow, hintSrcs, runHintSequence])

  const handleMouseLeave = useCallback(() => {
    if (containerRef.current) containerRef.current.style.cursor = 'default'
  }, [])

  if (!ambient) return null

  const originalBaseUrl = buildBasePath(ambient.id)
  const baseImgSrc      = sliderActive && compareLeftUrl
    ? compareLeftUrl
    : (baseDisplayUrl || compareLeftUrl || (hasBaseRender ? null : originalBaseUrl))

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
        src={baseImgSrc}
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

      {hintSrcs.slice(0, ambient.zones?.length ?? 0).map((src, i) => {
        const hintType = ambient.zones[i].hintZone?.type ?? 'layer'
        return (
          <img
            key={ambient.zones[i].id}
            className={`zone-hint${hintType === 'invert' ? ' is-invert' : ''}${hintZoneIdx === i ? ' is-active' : ''}`}
            src={src}
            alt=""
            draggable={false}
          />
        )
      })}

      {sliderActive && (
        <BeforeAfterSlider containerRef={containerRef} />
      )}

      <div className="ambient-actions">
        {backUrl && (
          <div className="navigation">
            <IconButton
              icon={ArrowLeft}
              label="Volver"
              onClick={(e) => { e.stopPropagation(); window.location.href = backUrl }}
            />
          </div>
        )}
        <div className="ui-actions">
          <IconButton
            icon={SplitSquareHorizontal}
            label={sliderActive ? 'Ocultar comparar' : 'Comparar antes / después'}
            active={sliderActive}
            onClick={(e) => { e.stopPropagation(); setSliderActive(v => !v) }}
          />
          <IconButton
            icon={Download}
            label="Descargar imagen"
            onClick={(e) => { e.stopPropagation(); download(selectedUrl || effectiveBaseUrl, ambient.id) }}
          />
        </div>
      </div>

      {children}
    </div>
  )
}

export default AmbientViewer
