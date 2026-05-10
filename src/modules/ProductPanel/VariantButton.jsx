import { buildThumbPath } from '../../utils/buildPaths.js'
const VariantButton = ({ variant, mode, baseTexture, isSelected, onClick }) => {
  const thumbSrc = mode === 'tint'
    ? buildThumbPath(baseTexture)
    : buildThumbPath(variant.id)

  const tintStyle = (mode === 'tint' && variant.value)
    ? { '--tint-color': `#${variant.value}` }
    : {}

  return (
    <button
      className={`variant-btn${isSelected ? ' is-selected' : ''}${mode === 'tint' && variant.value ? ' has-tint' : ''}`}
      style={tintStyle}
      onClick={onClick}
      title={variant.name}
      aria-pressed={isSelected}
    >
      <div className="variant-thumb">
        <img
          className="variant-thumb-img"
          src={thumbSrc}
          alt={variant.name}
          draggable={false}
        />
      </div>
      <span className="variant-name">{variant.name}</span>
    </button>
  )
}

export default VariantButton
