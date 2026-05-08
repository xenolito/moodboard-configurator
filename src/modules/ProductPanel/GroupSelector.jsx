import VariantButton from './VariantButton.jsx'
import './GroupSelector.css'

const GroupSelector = ({ groups, selectedVariant, onVariantSelect }) => (
  <div className="group-selector">
    {groups.map(group => (
      <div key={group.name} className="group-section">
        <h4 className="group-title">{group.name}</h4>
        <div className="group-variants">
          {group.variants.map(variant => (
            <VariantButton
              key={variant.id}
              variant={variant}
              mode={group.mode}
              baseTexture={group.baseTexture}
              isSelected={selectedVariant?.variantId === variant.id && selectedVariant?.groupName === group.name}
              onClick={() => onVariantSelect({ groupName: group.name, variantId: variant.id })}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
)

export default GroupSelector
