import { Tooltip, TooltipArrow, TooltipContent, TooltipPortal, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip'
const IconButton = ({ icon: Icon, label, onClick, disabled, active, size = 36 }) => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={`icon-btn${active ? ' is-active' : ''}`}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          <Icon size={18} strokeWidth={1.75} />
        </button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent className="tooltip-content" side="top" sideOffset={8}>
          {label}
          <TooltipArrow className="tooltip-arrow" />
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  </TooltipProvider>
)

export default IconButton
