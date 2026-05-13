import { buildModelThumbPath } from '../../utils/buildPaths.js'

const ModelSelector = ({ models, selectedModelId, onModelSelect, imageVariant }) => (
  <div className="model-selector">
    <h4 className="model-selector-title">Modelo</h4>
    <div className="model-list">
      {models.map(model => (
        <button
          key={model.id}
          className={`model-btn${model.id === selectedModelId ? ' is-selected' : ''}`}
          onClick={() => onModelSelect(model.id)}
          aria-pressed={model.id === selectedModelId}
          title={model.name}
        >
          <picture>
          <img
            className={`model-thumb${imageVariant ? ` model-thumb-variant-${imageVariant}` : ''}`}
            src={buildModelThumbPath(model.model_image, imageVariant)}
            alt={model.name}
            draggable={false}
            />
          </picture>
          <span className="model-name">{model.name}</span>
        </button>
      ))}
    </div>
  </div>
)

export default ModelSelector
