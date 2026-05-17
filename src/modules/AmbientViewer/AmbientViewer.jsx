import { useRef, useCallback, useState, useEffect } from 'react'
import { SplitSquareHorizontal, Download, ArrowLeft, Info } from 'lucide-react'
import { useMaskDetection } from '../../hooks/useMaskDetection.js'
import { buildCompareComposite } from '../../utils/buildCompareComposite.js'
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
  onInfoClick,
  onDownload,
  children
}) => {
  const containerRef        = useRef(null)
  const hintSeqTimerRef     = useRef(null)
  const autoHintIntervalRef = useRef(null)
  const autoHintDoneRef     = useRef(false)
  const downloadingRef      = useRef(false)
  const [sliderActive, setSliderActive]       = useState(false)
  useEffect(() => { onSliderChange?.(sliderActive) }, [sliderActive, onSliderChange])
  const [selectedUrl, setSelectedUrl]         = useState(null)
  const [incomingUrl, setIncomingUrl]         = useState(null)
  const [leftDisplayUrl, setLeftDisplayUrl]   = useState(null)
  const [leftIncomingUrl, setLeftIncomingUrl] = useState(null)
  const [hintZoneIdx, setHintZoneIdx]         = useState(null)
  const zone     = ambient?.zones?.[0]
  const maskUrl  = ambient?.mask ? buildMaskPath(ambient.id, ambient.mask) : null
  const hintSrcs = useZoneHintMasks(maskUrl, ambient?.zones ?? [])
  const { getZoneAtPoint } = useMaskDetection(ambient?.mask ?? null)

  useEffect(() => {
    if (renderUrl) {
      setIncomingUrl(renderUrl)
      return
    }
    if (!renderLoading) {
      setSelectedUrl(null)
      setIncomingUrl(null)
      setSliderActive(false)
      setLeftDisplayUrl(null)
      setLeftIncomingUrl(null)
      setHintZoneIdx(null)
    }
  }, [renderUrl, renderLoading])

  useEffect(() => {
    if (!compareLeftUrl) {
      setLeftIncomingUrl(null)
      return
    }
    if (compareLeftUrl === leftDisplayUrl) return
    if (!leftDisplayUrl) {
      setLeftDisplayUrl(compareLeftUrl)
      return
    }
    setLeftIncomingUrl(compareLeftUrl)
  }, [compareLeftUrl, leftDisplayUrl])

  const handleIncomingEnd = useCallback((e) => {
    if (e.propertyName !== 'opacity') return
    setSelectedUrl(incomingUrl)
    setIncomingUrl(null)
  }, [incomingUrl])

  const handleLeftIncomingEnd = useCallback((e) => {
    if (e.propertyName !== 'opacity') return
    setLeftDisplayUrl(leftIncomingUrl)
    setLeftIncomingUrl(null)
  }, [leftIncomingUrl])

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
    clearInterval(autoHintIntervalRef.current)
    clearTimeout(hintSeqTimerRef.current)
    autoHintIntervalRef.current = null
    setHintZoneIdx(null)

    const timeToShow = ambient?.autoHint?.timeToShow
    if (!timeToShow || !hintSrcs.length || autoHintStopped) {
      autoHintDoneRef.current = true
      return
    }

    autoHintDoneRef.current = false
    const delayMs = timeToShow * 1000
    autoHintIntervalRef.current = setInterval(() => {
      if (autoHintDoneRef.current) return
      runHintSequence()
    }, delayMs)

    return () => {
      clearInterval(autoHintIntervalRef.current)
      autoHintIntervalRef.current = null
    }
  }, [ambient?.id, ambient?.autoHint?.timeToShow, hintSrcs, runHintSequence, autoHintStopped])

  const handleMouseLeave = useCallback(() => {
    if (containerRef.current) containerRef.current.style.cursor = 'default'
  }, [])

  if (!ambient) return null

  const originalBaseUrl = buildBasePath(ambient.id)
  const leftShownUrl = leftDisplayUrl || compareLeftUrl
  const baseImgSrc   = hasBaseRender ? null : originalBaseUrl

  return (
    <div
      className={`ambient-viewer${sliderActive ? ' slider-active' : ''}${panelPosition === 'left' ? ' actions-right' : ''}`}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseLeave={handleMouseLeave}
    >
      {baseImgSrc && (
        <img
          className="ambient-base"
          src={baseImgSrc}
          alt={ambient.name}
          draggable={false}
        />
      )}

      {leftShownUrl && (
        <img
          key={`L:${leftShownUrl}`}
          className="ambient-selected-render is-loaded"
          src={leftShownUrl}
          alt=""
          draggable={false}
        />
      )}

      {leftIncomingUrl && (
        <img
          key={`L:${leftIncomingUrl}`}
          className="ambient-selected-render is-incoming is-loaded"
          src={leftIncomingUrl}
          alt=""
          draggable={false}
          onTransitionEnd={handleLeftIncomingEnd}
        />
      )}

      {selectedUrl && (
        <img
          key={selectedUrl}
          className={`ambient-selected-render is-loaded${sliderActive ? ' slider-split' : ''}`}
          src={selectedUrl}
          alt=""
          draggable={false}
        />
      )}
      {incomingUrl && (
        <img
          key={incomingUrl}
          className={`ambient-selected-render is-incoming is-loaded${sliderActive ? ' slider-split' : ''}`}
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
            label="Descarga tu ambiente"
            onClick={async (e) => {
              e.stopPropagation()
              if (downloadingRef.current) return
              downloadingRef.current = true
              try {
                if (sliderActive) {
                  const sliderXStr = containerRef.current?.style.getPropertyValue('--slider-x') || '50%'
                  const sliderXPct = parseFloat(sliderXStr) / 100
                  const compositeUrl = await buildCompareComposite(
                    leftShownUrl || originalBaseUrl,
                    selectedUrl  || originalBaseUrl,
                    sliderXPct
                  )
                  onDownload?.({ type: 'compare', url: compositeUrl })
                  setTimeout(() => URL.revokeObjectURL(compositeUrl), 30000)
                } else {
                  onDownload?.({ type: 'single', url: selectedUrl || originalBaseUrl })
                }
              } finally {
                downloadingRef.current = false
              }
            }}
          />
          <IconButton
            icon={Info}
            label="Información del producto"
            disabled={!selectedUrl}
            onClick={(e) => { e.stopPropagation(); onInfoClick?.() }}
          />
        </div>
      </div>

      {children}
    </div>
  )
}

export default AmbientViewer
