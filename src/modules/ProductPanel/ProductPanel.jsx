import { X } from 'lucide-react'
import ModelSelector from './ModelSelector.jsx'
import GroupSelector from './GroupSelector.jsx'
import Spinner from '../../ui/Spinner.jsx'

const ProductPanel = ({
  zone,
  panelOpen = false,
  panelPosition = 'right',
  comparing = false,
  selectedModelId,
  selectedVariant,
  renderLoading,
  onModelSelect,
  onVariantSelect,
  onClose
}) => {
  const isOpen = !!zone && panelOpen && !comparing
  const selectedModel = zone?.models?.find(m => m.id === selectedModelId)
  const posClass = panelPosition === 'left' ? ' panel-left' : ''

  return (
    <aside className={`product-panel${posClass}${isOpen ? ' is-open' : ''}`} inert={!isOpen || undefined}>
      <div className="panel-header">
        <h3 className="panel-title">{zone?.label ?? 'Selección'}</h3>
        <div className="panel-header-actions">
          {renderLoading && <Spinner size={20} />}
          <button className="panel-close" onClick={onClose} aria-label="Cerrar panel">
            <X size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="panel-body">
        {zone?.models?.length > 0 ? (
          <>
            <ModelSelector
              models={zone.models}
              selectedModelId={selectedModelId}
              onModelSelect={onModelSelect}
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
