import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip'
import './IconButton.css'

const IconButton = ({ icon: Icon, label, onClick, disabled, active, size = 36 }) => (
  <TooltipProvider delayDuration={400}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={`icon-btn${active ? ' is-active' : ''}`}
          style={{ '--icon-btn-size': `${size}px` }}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          <Icon size={18} strokeWidth={1.75} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        <span>{label}</span>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

export default IconButton
