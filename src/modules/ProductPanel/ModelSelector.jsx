const ModelSelector = ({ models, selectedModelId, onModelSelect }) => (
  <div className="model-selector">
    <h4 className="model-selector-title">Modelo</h4>
    <div className="model-list">
      {models.map(model => (
        <button
          key={model.id}
          className={`model-btn${model.id === selectedModelId ? ' is-selected' : ''}`}
          onClick={() => onModelSelect(model.id)}
          aria-pressed={model.id === selectedModelId}
        >
          {model.name}
        </button>
      ))}
    </div>
  </div>
)

export default ModelSelector
