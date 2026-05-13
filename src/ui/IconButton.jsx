import { useState, useRef, useEffect } from 'react'
import { Tooltip, TooltipArrow, TooltipContent, TooltipPortal, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip'
import { subscribeModal } from '../utils/modalSignal.js'

// Chrome fires a synthetic pointerenter on the element that triggered showModal()
// when the dialog closes. We suppress tooltip re-opening for a window that
// comfortably covers the full modal open→close animation cycle (~320ms).
const POST_CLICK_SUPPRESS_MS = 900

const IconButton = ({ icon: Icon, label, onClick, disabled, active, size = 36 }) => {
  const [open, setOpen] = useState(false)
  const suppressRef = useRef(false)
  const timerRef = useRef(null)

  useEffect(() => {
    return subscribeModal((isOpen) => {
      if (isOpen) {
        setOpen(false)
        suppressRef.current = true
        clearTimeout(timerRef.current)
      } else {
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => { suppressRef.current = false }, 400)
      }
    })
  }, [])

  const handleClick = (e) => {
    setOpen(false)
    suppressRef.current = true
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { suppressRef.current = false }, POST_CLICK_SUPPRESS_MS)
    onClick?.(e)
  }

  const handleOpenChange = (val) => {
    if (val && suppressRef.current) return
    setOpen(val)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={open} onOpenChange={handleOpenChange}>
        <TooltipTrigger asChild>
          <button
            className={`icon-btn${active ? ' is-active' : ''}`}
            onClick={handleClick}
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
}

export default IconButton
