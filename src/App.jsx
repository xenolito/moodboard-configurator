import { useState, useEffect } from 'react'
import { useAmbientConfig } from './hooks/useAmbientConfig.js'
import { useRenderLoader } from './hooks/useRenderLoader.js'
import AmbientViewer from './modules/AmbientViewer/AmbientViewer.jsx'
import ProductPanel from './modules/ProductPanel/ProductPanel.jsx'

const rootEl = document.getElementById('ambient_viewer')
const initialAmbientId = rootEl?.dataset?.ambientId ?? 'adoquines'
const datasetBackUrl   = rootEl?.dataset?.backUrl   ?? null

const App = () => {
  const { config, loading, error } = useAmbientConfig()

  const [selectedAmbientId, setSelectedAmbientId] = useState(initialAmbientId)
  const [selectedZoneId, setSelectedZoneId]       = useState(null)
  const [selectedModelId, setSelectedModelId]     = useState(null)
  const [selectedVariant, setSelectedVariant]     = useState(null)
  const [sliderActive, setSliderActive]           = useState(false)
  const [panelOpen, setPanelOpen]                 = useState(false)
  const [compareSlot, setCompareSlot]             = useState('right')
  const [leftModelId, setLeftModelId]             = useState(null)
  const [leftVariant, setLeftVariant]             = useState(null)
  const [userInteracted, setUserInteracted]       = useState(false)

  const ambient         = config?.ambients?.find(a => a.id === selectedAmbientId)
  const activeZone      = ambient?.zones?.find(z => z.id === selectedZoneId) ?? null
  const panelPosition   = ambient?.panelSelectorPosition ?? 'right'
  const effectiveBackUrl = datasetBackUrl || ambient?.backUrl || null

  const { url: renderUrl, loading: renderLoading } = useRenderLoader(
    selectedAmbientId,
    selectedModelId,
    selectedVariant?.variantId ?? null
  )
  const { url: leftRenderUrl } = useRenderLoader(
    selectedAmbientId,
    leftModelId,
    leftVariant?.variantId ?? null
  )

  useEffect(() => {
    if (sliderActive) setPanelOpen(false)
    else setCompareSlot('right')
  }, [sliderActive])

  useEffect(() => {
    if (!ambient?.zones?.length) return
    setSelectedZoneId(ambient.zones[0].id)
    setSelectedModelId(null)
    setSelectedVariant(null)
    setCompareSlot('right')
    setLeftModelId(ambient.baseRender?.modelId ?? null)
    setLeftVariant(ambient.baseRender?.variantId
      ? { groupName: null, variantId: ambient.baseRender.variantId }
      : null)
    const delayMs = (ambient.panelOpenDelay ?? 0) * 1000
    let r1, r2
    const timer = setTimeout(() => {
      r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setPanelOpen(true)) })
    }, delayMs)
    return () => { clearTimeout(timer); cancelAnimationFrame(r1); cancelAnimationFrame(r2) }
  }, [ambient?.id])

  const handleAmbientSwitch = (id) => {
    if (id === selectedAmbientId) return
    setUserInteracted(false)
    setSelectedAmbientId(id)
    setSelectedZoneId(null)
    setSelectedModelId(null)
    setSelectedVariant(null)
    setSliderActive(false)
    setPanelOpen(false)
    setCompareSlot('right')
    setLeftModelId(null)
    setLeftVariant(null)
  }

  const getFirstVariant = (model) => {
    const group = model?.groups?.[0]
    const variant = group?.variants?.[0]
    return variant ? { groupName: group.name, variantId: variant.id } : null
  }

  const handleModelSelect = (modelId) => {
    setUserInteracted(true)
    if (sliderActive && compareSlot === 'left') {
      if (modelId === leftModelId) return
      const model = activeZone?.models?.find(m => m.id === modelId)
      setLeftModelId(modelId)
      setLeftVariant(getFirstVariant(model))
    } else {
      if (modelId === selectedModelId) return
      const model = activeZone?.models?.find(m => m.id === modelId)
      setSelectedModelId(modelId)
      setSelectedVariant(getFirstVariant(model))
    }
  }

  const handleVariantSelect = (variant) => {
    setUserInteracted(true)
    if (sliderActive && compareSlot === 'left') setLeftVariant(variant)
    else setSelectedVariant(variant)
  }

  if (loading) return <div className="app-loading">Cargando...</div>
  if (error)   return <div className="app-error">Error: {error}</div>

  return (
    <div className="app">
      <nav className="ambient-switcher" role="tablist" aria-label="Selección de ambiente">
        {config.ambients.map(a => (
          <button
            key={a.id}
            role="tab"
            className={`ambient-tab${a.id === selectedAmbientId ? ' is-active' : ''}`}
            aria-selected={a.id === selectedAmbientId}
            onClick={() => handleAmbientSwitch(a.id)}
          >
            {a.name}
          </button>
        ))}
      </nav>

      <div className="app-viewer-wrap">
        <AmbientViewer
          ambient={ambient}
          panelPosition={panelPosition}
          renderUrl={renderUrl}
          renderLoading={renderLoading}
          compareLeftUrl={leftRenderUrl}
          onSliderChange={setSliderActive}
          panelOpen={panelOpen}
          backUrl={effectiveBackUrl}
          autoHintStopped={userInteracted}
          onOutsideZoneClick={sliderActive || ambient?.autohidePanel ? () => setPanelOpen(false) : undefined}
          onZoneClick={(zoneId) => {
            setUserInteracted(true)
            setSelectedZoneId(zoneId)
            if (!selectedModelId) {
              setSelectedVariant(null)
            }
            setPanelOpen(true)
          }}
          onCompareSlotClick={(slot) => {
            setCompareSlot(slot)
            if (!selectedZoneId && ambient?.zones?.length) {
              setSelectedZoneId(ambient.zones[0].id)
            }
          }}
        />

        <ProductPanel
          zone={activeZone}
          panelOpen={panelOpen}
          panelPosition={panelPosition}
          comparing={sliderActive}
          compareSlot={sliderActive ? compareSlot : null}
          selectedModelId={sliderActive && compareSlot === 'left' ? leftModelId  : selectedModelId}
          selectedVariant={sliderActive && compareSlot === 'left' ? leftVariant  : selectedVariant}
          onModelSelect={handleModelSelect}
          onVariantSelect={handleVariantSelect}
          onToggle={() => setPanelOpen(v => !v)}
        />
      </div>
    </div>
  )
}

export default App
