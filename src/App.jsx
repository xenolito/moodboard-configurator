import { useState, useEffect, useMemo } from 'react'
import { useAmbientConfig } from './hooks/useAmbientConfig.js'
import { useRenderLoader } from './hooks/useRenderLoader.js'
import { buildCombinedRenderPath } from './utils/buildPaths.js'
import AmbientViewer from './modules/AmbientViewer/AmbientViewer.jsx'
import ProductPanel from './modules/ProductPanel/ProductPanel.jsx'

const rootEl = document.getElementById('ambient_viewer')
const initialAmbientId = rootEl?.dataset?.ambientId ?? 'adoquines'
const datasetBackUrl   = rootEl?.dataset?.backUrl   ?? null

const App = () => {
  const { config, loading, error } = useAmbientConfig()

  const [selectedAmbientId, setSelectedAmbientId] = useState(initialAmbientId)
  const [selectedZoneId, setSelectedZoneId]       = useState(null)
  const [zoneSelections, setZoneSelections]       = useState({})
  const [sliderActive, setSliderActive]           = useState(false)
  const [panelOpen, setPanelOpen]                 = useState(false)
  const [compareSlot, setCompareSlot]             = useState('right')
  const [leftModelId, setLeftModelId]             = useState(null)
  const [leftVariant, setLeftVariant]             = useState(null)
  const [leftZoneSelections, setLeftZoneSelections] = useState({})
  const [userInteracted, setUserInteracted]       = useState(false)

  const ambient         = config?.ambients?.find(a => a.id === selectedAmbientId)
  const activeZone      = ambient?.zones?.find(z => z.id === selectedZoneId) ?? null
  const panelPosition   = ambient?.panelSelectorPosition ?? 'right'
  const effectiveBackUrl = datasetBackUrl || ambient?.backUrl || null

  const selectedModelId = zoneSelections[selectedZoneId]?.modelId ?? null
  const selectedVariant = zoneSelections[selectedZoneId]?.variant  ?? null

  const isCombinedRenders = !!ambient?.combinedRenders
  const combinedRenderUrl = useMemo(() => {
    if (!isCombinedRenders || !ambient?.zones?.length) return null
    const segments = ambient.zones.map(z => {
      const selection = zoneSelections[z.id]
      const model = z.models?.find(m => m.id === selection?.modelId)
      return { prefix: model?.renderPrefix, variantId: selection?.variant?.variantId }
    })
    if (segments.some(s => !s.prefix || !s.variantId)) return null
    return buildCombinedRenderPath(ambient.id, segments)
  }, [isCombinedRenders, ambient, zoneSelections])

  const { url: renderUrl, loading: renderLoading } = useRenderLoader(
    selectedAmbientId,
    isCombinedRenders ? null : selectedModelId,
    isCombinedRenders ? null : (selectedVariant?.variantId ?? null),
    isCombinedRenders ? combinedRenderUrl : null
  )
  const leftCombinedRenderUrl = useMemo(() => {
    if (!isCombinedRenders || !ambient?.zones?.length) return null
    const segments = ambient.zones.map(z => {
      const selection = leftZoneSelections[z.id]
      const model = z.models?.find(m => m.id === selection?.modelId)
      return { prefix: model?.renderPrefix, variantId: selection?.variant?.variantId }
    })
    if (segments.some(s => !s.prefix || !s.variantId)) return null
    return buildCombinedRenderPath(ambient.id, segments)
  }, [isCombinedRenders, ambient, leftZoneSelections])

  const { url: leftRenderUrl } = useRenderLoader(
    selectedAmbientId,
    isCombinedRenders ? null : leftModelId,
    isCombinedRenders ? null : (leftVariant?.variantId ?? null),
    isCombinedRenders ? leftCombinedRenderUrl : null
  )

  useEffect(() => {
    if (sliderActive) setPanelOpen(false)
    else setCompareSlot('right')
  }, [sliderActive])

  useEffect(() => {
    if (!ambient?.zones?.length) return
    setSelectedZoneId(ambient.zones[0].id)
    const resolveVariantFromEntry = (entry) => {
      if (!entry.variantId) return null
      const zone = ambient.zones.find(z => z.id === entry.zoneId)
      const model = zone?.models?.find(m => m.id === entry.modelId)
      const group = model?.groups?.find(g => g.variants?.some(v => v.id === entry.variantId))
      return { groupName: group?.name ?? null, variantId: entry.variantId }
    }
    const initialSelections = {}
    if (Array.isArray(ambient.baseRender)) {
      for (const entry of ambient.baseRender) {
        initialSelections[entry.zoneId] = { modelId: entry.modelId, variant: resolveVariantFromEntry(entry) }
      }
    } else {
      for (const zone of ambient.zones) {
        if (zone.models?.length === 1) {
          const model = zone.models[0]
          const group = model?.groups?.[0]
          const variant = group?.variants?.[0]
          if (variant) initialSelections[zone.id] = { modelId: model.id, variant: { groupName: group.name, variantId: variant.id } }
        }
      }
    }
    setZoneSelections(initialSelections)
    setCompareSlot('right')
    if (Array.isArray(ambient.baseRender)) {
      const leftSelections = {}
      for (const entry of ambient.baseRender) {
        leftSelections[entry.zoneId] = { modelId: entry.modelId, variant: resolveVariantFromEntry(entry) }
      }
      setLeftZoneSelections(leftSelections)
      setLeftModelId(null)
      setLeftVariant(null)
    } else {
      setLeftZoneSelections({})
      setLeftModelId(ambient.baseRender?.modelId ?? null)
      setLeftVariant(ambient.baseRender?.variantId
        ? { groupName: ambient.baseRender.groupName ?? null, variantId: ambient.baseRender.variantId }
        : null)
    }
    if (ambient.zones.length > 1) return
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
    setZoneSelections({})
    setSliderActive(false)
    setPanelOpen(false)
    setCompareSlot('right')
    setLeftModelId(null)
    setLeftVariant(null)
    setLeftZoneSelections({})
  }

  const getFirstVariant = (model) => {
    const group = model?.groups?.[0]
    const variant = group?.variants?.[0]
    return variant ? { groupName: group.name, variantId: variant.id } : null
  }

  const handleModelSelect = (modelId) => {
    setUserInteracted(true)
    if (sliderActive && compareSlot === 'left') {
      if (isCombinedRenders) {
        const model = activeZone?.models?.find(m => m.id === modelId)
        setLeftZoneSelections(prev => {
          if (prev[selectedZoneId]?.modelId === modelId) return prev
          return { ...prev, [selectedZoneId]: { modelId, variant: getFirstVariant(model) } }
        })
      } else {
        if (modelId === leftModelId) return
        const model = activeZone?.models?.find(m => m.id === modelId)
        setLeftModelId(modelId)
        setLeftVariant(getFirstVariant(model))
      }
    } else {
      if (modelId === selectedModelId) return
      const model = activeZone?.models?.find(m => m.id === modelId)
      setZoneSelections(prev => ({
        ...prev,
        [selectedZoneId]: { modelId, variant: getFirstVariant(model) }
      }))
    }
  }

  const handleVariantSelect = (variant) => {
    setUserInteracted(true)
    if (sliderActive && compareSlot === 'left') {
      if (isCombinedRenders) {
        setLeftZoneSelections(prev => ({
          ...prev,
          [selectedZoneId]: { ...prev[selectedZoneId], variant }
        }))
      } else {
        setLeftVariant(variant)
      }
    } else {
      setZoneSelections(prev => ({
        ...prev,
        [selectedZoneId]: { ...prev[selectedZoneId], variant }
      }))
    }
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
          hasBaseRender={!!ambient?.baseRender}
          onSliderChange={setSliderActive}
          panelOpen={panelOpen}
          backUrl={effectiveBackUrl}
          autoHintStopped={userInteracted}
          onOutsideZoneClick={sliderActive || ambient?.autohidePanel ? () => setPanelOpen(false) : undefined}
          onZoneClick={(zoneId) => {
            setUserInteracted(true)
            setSelectedZoneId(zoneId)
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
          selectedModelId={sliderActive && compareSlot === 'left'
            ? (isCombinedRenders ? (leftZoneSelections[selectedZoneId]?.modelId ?? null) : leftModelId)
            : selectedModelId}
          selectedVariant={sliderActive && compareSlot === 'left'
            ? (isCombinedRenders ? (leftZoneSelections[selectedZoneId]?.variant ?? null) : leftVariant)
            : selectedVariant}
          onModelSelect={handleModelSelect}
          onVariantSelect={handleVariantSelect}
          onToggle={() => setPanelOpen(v => !v)}
        />
      </div>
    </div>
  )
}

export default App
