import { useRef, useCallback, useState, useEffect } from 'react'
import { SplitSquareHorizontal, Download } from 'lucide-react'
import { useMaskDetection } from '../../hooks/useMaskDetection.js'
import { useDownload } from '../Download/useDownload.js'
import BeforeAfterSlider from '../Slider/BeforeAfterSlider.jsx'
import IconButton from '../../ui/IconButton.jsx'
import { buildBasePath } from '../../utils/buildPaths.js'
import './AmbientViewer.css'

const AmbientViewer = ({
  ambient,
  renderUrl,
  renderLoading,
  onZoneClick,
  children
}) => {
  const containerRef = useRef(null)
  const [sliderActive, setSliderActive]       = useState(false)
  const [baseDisplayUrl, setBaseDisplayUrl]   = useState(null)
  const [selectedUrl, setSelectedUrl]         = useState(null)
  const [incomingUrl, setIncomingUrl]         = useState(null)
  const [incomingVisible, setIncomingVisible] = useState(false)
  const zone = ambient?.zones?.[0]
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
    if (zoneId) onZoneClick?.(zoneId)
  }, [ambient, zone, sliderActive, getZoneAtPoint, onZoneClick])

  const handleMouseLeave = useCallback(() => {
    if (containerRef.current) containerRef.current.style.cursor = 'default'
  }, [])

  if (!ambient) return null

  const originalBaseUrl  = buildBasePath(ambient.id)
  const effectiveBaseUrl = baseDisplayUrl || originalBaseUrl

  return (
    <div
      className={`ambient-viewer${sliderActive ? ' slider-active' : ''}`}
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

      {sliderActive && selectedUrl && (
        <BeforeAfterSlider containerRef={containerRef} />
      )}

      <div className="ambient-actions">
        {selectedUrl && (
          <IconButton
            icon={SplitSquareHorizontal}
            label={sliderActive ? 'Ocultar comparativa' : 'Comparar antes/después'}
            active={sliderActive}
            onClick={(e) => { e.stopPropagation(); setSliderActive(v => !v) }}
          />
        )}
        {selectedUrl && (
          <IconButton
            icon={Download}
            label="Descargar imagen"
            onClick={(e) => { e.stopPropagation(); download(selectedUrl, ambient.id) }}
          />
        )}
      </div>

      {children}
    </div>
  )
}

export default AmbientViewer
