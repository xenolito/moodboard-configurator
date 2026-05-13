import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ModelSelector from './ModelSelector.jsx'
import GroupSelector from './GroupSelector.jsx'

const ProductPanel = ({
  zone,
  panelOpen = false,
  panelPosition = 'right',
  comparing = false,
  compareSlot = null,
  selectedModelId,
  selectedVariant,
  onModelSelect,
  onVariantSelect,
  onToggle,
  imageVariant
}) => {
  const asideRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const el = asideRef.current
    if (!el) return
    const check = () => setIsMobile(getComputedStyle(el).position !== 'absolute')
    check()
    const ro = new ResizeObserver(check)
    ro.observe(document.documentElement)
    return () => ro.disconnect()
  }, [])

  const isOpen = isMobile || (!!zone && panelOpen)
  const selectedModel = zone?.models?.find(m => m.id === selectedModelId)
  const posClass = panelPosition === 'left' ? ' panel-left' : ''
  const ToggleIcon = panelPosition === 'right'
    ? (panelOpen ? ChevronRight : ChevronLeft)
    : (panelOpen ? ChevronLeft : ChevronRight)

  return (
    <aside ref={asideRef} className={`product-panel${posClass}${isOpen ? ' is-open' : ''}`}>
      <div className="panel-header">
        <h3 className="panel-title">{zone?.label ?? 'Selección'}</h3>
        {compareSlot && (
          <span className="panel-compare-badge">
            {compareSlot === 'left' ? 'Antes' : 'Después'}
          </span>
        )}
        <div className="panel-header-actions">
          {zone && (
            <button
              className="panel-close"
              onClick={onToggle}
              aria-label={panelOpen ? 'Cerrar panel' : 'Abrir panel'}
            >
              <ToggleIcon size={18} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      <div className="panel-body" inert={!isOpen || undefined}>
        {zone?.models?.length > 0 ? (
          <>
            <ModelSelector
              models={zone.models}
              selectedModelId={selectedModelId}
              onModelSelect={onModelSelect}
              imageVariant={imageVariant}
            />
            {selectedModel && (
              <GroupSelector
                groups={selectedModel.groups}
                selectedVariant={selectedVariant}
                onVariantSelect={onVariantSelect}
              />
            )}
          </>
        ) : (
          <p className="panel-empty">No hay modelos disponibles para este ambiente.</p>
        )}
      </div>
    </aside>
  )
}

export default ProductPanel
