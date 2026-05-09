import { useState, useEffect } from 'react'
import { useAmbientConfig } from './hooks/useAmbientConfig.js'
import { useRenderLoader } from './hooks/useRenderLoader.js'
import AmbientViewer from './modules/AmbientViewer/AmbientViewer.jsx'
import ProductPanel from './modules/ProductPanel/ProductPanel.jsx'

const rootEl = document.getElementById('ambient_viewer')
const initialAmbientId = rootEl?.dataset?.ambientId ?? 'adoquines'

const App = () => {
  const { config, loading, error } = useAmbientConfig()

  const [selectedAmbientId, setSelectedAmbientId] = useState(initialAmbientId)
  const [selectedZoneId, setSelectedZoneId]       = useState(null)
  const [selectedModelId, setSelectedModelId]     = useState(null)
  const [selectedVariant, setSelectedVariant]     = useState(null)
  const [sliderActive, setSliderActive]           = useState(false)
  const [panelOpen, setPanelOpen]                 = useState(false)

  const ambient       = config?.ambients?.find(a => a.id === selectedAmbientId)
  const activeZone    = ambient?.zones?.find(z => z.id === selectedZoneId) ?? null
  const panelPosition = ambient?.panelSelectorPosition ?? 'right'

  const { url: renderUrl, loading: renderLoading } = useRenderLoader(
    selectedAmbientId,
    selectedModelId,
    selectedVariant?.variantId ?? null
  )

  useEffect(() => {
    if (sliderActive) setPanelOpen(false)
  }, [sliderActive])

  useEffect(() => {
    if (!ambient || ambient.zones?.length !== 1) return
    setSelectedZoneId(ambient.zones[0].id)
    setSelectedModelId(null)
    setSelectedVariant(null)
    const delayMs = (ambient.panelOpenDelay ?? 0) * 1000
    let r1, r2
    const timer = setTimeout(() => {
      r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setPanelOpen(true)) })
    }, delayMs)
    return () => { clearTimeout(timer); cancelAnimationFrame(r1); cancelAnimationFrame(r2) }
  }, [ambient?.id])

  const handleAmbientSwitch = (id) => {
    setSelectedAmbientId(id)
    setSelectedZoneId(null)
    setSelectedModelId(null)
    setSelectedVariant(null)
    setSliderActive(false)
    setPanelOpen(false)
  }

  const getFirstVariant = (model) => {
    const group = model?.groups?.[0]
    const variant = group?.variants?.[0]
    return variant ? { groupName: group.name, variantId: variant.id } : null
  }

  const handleModelSelect = (modelId) => {
    if (modelId === selectedModelId) return
    const model = activeZone?.models?.find(m => m.id === modelId)
    setSelectedModelId(modelId)
    setSelectedVariant(getFirstVariant(model))
  }

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant)
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
          onSliderChange={setSliderActive}
          panelOpen={panelOpen}
          onOutsideZoneClick={ambient?.autohidePanel ? () => setPanelOpen(false) : undefined}
          onZoneClick={(zoneId) => {
            setSelectedZoneId(zoneId)
            if (!selectedModelId) {
              setSelectedVariant(null)
            }
            setPanelOpen(true)
          }}
        />

        <ProductPanel
          zone={activeZone}
          panelOpen={panelOpen}
          panelPosition={panelPosition}
          comparing={sliderActive}
          selectedModelId={selectedModelId}
          selectedVariant={selectedVariant}
          onModelSelect={handleModelSelect}
          onVariantSelect={handleVariantSelect}
          onToggle={() => setPanelOpen(v => !v)}
        />
      </div>
    </div>
  )
}

export default App
