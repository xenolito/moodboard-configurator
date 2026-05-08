import { useState } from 'react'
import { useAmbientConfig } from './hooks/useAmbientConfig.js'
import { useRenderLoader } from './hooks/useRenderLoader.js'
import AmbientViewer from './modules/AmbientViewer/AmbientViewer.jsx'
import ProductPanel from './modules/ProductPanel/ProductPanel.jsx'
import './style.css'

const rootEl = document.getElementById('ambient_viewer')
const initialAmbientId = rootEl?.dataset?.ambientId ?? 'adoquines'

const App = () => {
  const { config, loading, error } = useAmbientConfig()

  const [selectedAmbientId, setSelectedAmbientId] = useState(initialAmbientId)
  const [selectedZoneId, setSelectedZoneId]       = useState(null)
  const [selectedModelId, setSelectedModelId]     = useState(null)
  const [selectedVariant, setSelectedVariant]     = useState(null)

  const ambient    = config?.ambients?.find(a => a.id === selectedAmbientId)
  const activeZone = ambient?.zones?.find(z => z.id === selectedZoneId) ?? null

  const { url: renderUrl, loading: renderLoading } = useRenderLoader(
    selectedAmbientId,
    selectedModelId,
    selectedVariant?.variantId ?? null
  )

  const handleAmbientSwitch = (id) => {
    setSelectedAmbientId(id)
    setSelectedZoneId(null)
    setSelectedModelId(null)
    setSelectedVariant(null)
  }

  const handleModelSelect = (modelId) => {
    setSelectedModelId(modelId)
    setSelectedVariant(null)
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
          renderUrl={renderUrl}
          renderLoading={renderLoading}
          onZoneClick={(zoneId) => {
            setSelectedZoneId(zoneId)
            if (!selectedModelId && ambient?.zones?.find(z => z.id === zoneId)?.models?.length > 0) {
              setSelectedModelId(ambient.zones.find(z => z.id === zoneId).models[0].id)
            }
          }}
        />

        <ProductPanel
          zone={activeZone}
          selectedModelId={selectedModelId}
          selectedVariant={selectedVariant}
          renderLoading={renderLoading}
          onModelSelect={handleModelSelect}
          onVariantSelect={handleVariantSelect}
          onClose={() => setSelectedZoneId(null)}
        />
      </div>
    </div>
  )
}

export default App
