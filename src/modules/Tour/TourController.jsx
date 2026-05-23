import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Joyride, EVENTS, STATUS } from 'react-joyride'
import { ArrowRight } from 'lucide-react'

const TOUR_STYLES = {
  options: {
    arrowColor: '#222',
    overlayColor: 'rgba(0,0,0,0.55)',
    zIndex: 10000,
  },
}

const TOUR_STYLES_LINE = {
  options: {
    overlayColor: 'rgba(0,0,0,0.6)',
    zIndex: 10000,
  },
}

const TourTooltip = ({
  continuous,
  index,
  isLastStep,
  size,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  arrowType = 'arrow',
}) => (
  <div {...tooltipProps} className={`tour-tooltip${arrowType === 'line' ? ' is-line' : ''}`}>
    <button {...closeProps} className="tour-tooltip-close" aria-label="Cerrar" title="Cerrar">✕</button>
    <div className="tour-tooltip-body">{step.content}</div>
    <div className="tour-tooltip-footer">
      <div className="tour-tooltip-left">
        <button {...skipProps} className="tour-tooltip-btn-skip" aria-label="Salir del tour" title="Salir del tour">Salir del tour</button>
      </div>
      <button {...primaryProps} className="tour-tooltip-btn-next wp-element-button" aria-label={isLastStep ? 'Terminar tour' : 'Siguiente'} title={isLastStep ? 'Terminar tour' : 'Siguiente'}>
        {isLastStep ? 'Terminar tour' : <ArrowRight size={18} />}
      </button>
    </div>
    <div className="tour-dots">
      {Array.from({ length: size }, (_, i) => (
        <span key={i} className={`tour-dot${i === index ? ' is-active' : ''}`} />
      ))}
    </div>
  </div>
)

const buildSteps = () => {
  const base = {
    disableBeacon: true,
    closeButtonAction: 'skip',
    dismissKeyAction: false,
    overlayClickAction: false,
  }

  return [
    { ...base, target: '.ambient-viewer',                               placement: 'center', content: <><h3>Bienvenido a la experiencia de Ambientes Interactivos</h3><p className='sub-heading'>Déjanos mostrarte rápidametne todo lo que puedes hacer.</p></>,      data: { id: 'welcome'  } },
    { ...base, target: '.ambient-viewer',                               placement: 'center', content: 'Toca en la zona que quieres personalizar.',                         data: { id: 'zones'    } },
    { ...base, target: '.product-panel',                                placement: 'left',   content: 'Elige modelo y color. Los cambios se reflejan en tiempo real.',      data: { id: 'panel'    } },
    { ...base, target: '.ui-actions button:first-child',                placement: 'top',    content: 'Activa la comparativa para ver dos opciones a la vez. Arrastra el divisor.', data: { id: 'compare'  } },
    { ...base, target: 'button[aria-label="Descarga tu ambiente"]',     placement: 'top',    content: 'Descarga tu ambiente.',                data: { id: 'download' } },
    { ...base, target: 'button[aria-label="Información del producto"]', placement: 'top',    content: 'Consulta en cualquier momento el modelo y color seleccionados.',    data: { id: 'info'     } },
    { ...base, target: 'button[aria-label="Volver"]',                   placement: 'top',    content: 'Cambia a otro ambiente interactivo cuando quieras.',                       data: { id: 'back'     } },
  ]
}

const STEPS = buildSteps()

const HINT_LOOP_DELAY = 600

const axisEdgePoints = (sr, tr) => {
  const sc = { x: sr.left + sr.width  / 2, y: sr.top  + sr.height / 2 }
  const tc = { x: tr.left + tr.width  / 2, y: tr.top  + tr.height / 2 }
  const overlapX = tr.left < sr.right  && tr.right  > sr.left
  const overlapY = tr.top  < sr.bottom && tr.bottom > sr.top
  const useVertical = overlapX || (!overlapY && Math.abs(sc.y - tc.y) >= Math.abs(sc.x - tc.x))

  if (useVertical) {
    const x  = Math.max(tr.left, Math.min(tr.right, sc.x))
    const y1 = sc.y > tc.y ? tr.bottom : tr.top
    const y2 = sc.y > tc.y ? sr.top    : sr.bottom
    return { x1: x, y1, x2: x, y2 }
  } else {
    const y  = Math.max(tr.top, Math.min(tr.bottom, sc.y))
    const x1 = sc.x > tc.x ? tr.right  : tr.left
    const x2 = sc.x > tc.x ? sr.left   : sr.right
    return { x1, y1: y, x2, y2: y }
  }
}

const TourConnectorLine = () => {
  const [coords, setCoords] = useState(null)
  const rafRef  = useRef(null)
  const prevRef = useRef(null)
  const svgRef  = useRef(null)

  const tick = useCallback(() => {
    const spotlight = document.querySelector('.react-joyride__spotlight path:nth-child(2)')

    const currentSvg = spotlight?.parentElement ?? null
    if (currentSvg !== svgRef.current) {
      if (svgRef.current) svgRef.current.classList.remove('tour-line')
      svgRef.current = currentSvg
      if (currentSvg) currentSvg.classList.add('tour-line')
    }

    const tooltip = document.querySelector('.tour-tooltip.is-line')
    let next = null
    if (spotlight && tooltip) {
      const sr = spotlight.getBoundingClientRect()
      const tr = tooltip.getBoundingClientRect()
      const sc = { x: sr.left + sr.width / 2, y: sr.top + sr.height / 2 }
      const tc = { x: tr.left + tr.width / 2, y: tr.top + tr.height / 2 }
      if (Math.hypot(sc.x - tc.x, sc.y - tc.y) > 40) {
        next = axisEdgePoints(sr, tr)
      }
    }
    const prev    = prevRef.current
    const changed = !prev !== !next || (next && prev && (
      Math.abs(prev.x1 - next.x1) > 0.5 || Math.abs(prev.y1 - next.y1) > 0.5 ||
      Math.abs(prev.x2 - next.x2) > 0.5 || Math.abs(prev.y2 - next.y2) > 0.5
    ))
    if (changed) { prevRef.current = next; setCoords(next) }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      if (svgRef.current) svgRef.current.classList.remove('tour-line')
    }
  }, [tick])

  if (!coords) return null

  return createPortal(
    <svg
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 10001 }}
      aria-hidden="true"
    >
      <line
        className="tour-connector-line"
        x1={coords.x1} y1={coords.y1}
        x2={coords.x2} y2={coords.y2}
      />
    </svg>,
    document.body
  )
}

const TourController = ({
  arrowType = 'arrow',
  onRunHint,
  onActivateCompare,
  onDeactivateCompare,
  onOpenPanel,
  onClosePanel,
  onComplete,
}) => {
  const [run, setRun] = useState(false)
  const compareActiveRef  = useRef(false)
  const hintLoopTimerRef  = useRef(null)
  const hintLoopActiveRef = useRef(false)


  useEffect(() => {
    const t = setTimeout(() => setRun(true), 700)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && run) {
        setRun(false)
        stopHintLoop()
        if (compareActiveRef.current) {
          onDeactivateCompare()
          compareActiveRef.current = false
        }
        onClosePanel()
        onComplete()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [run, onDeactivateCompare, onClosePanel, onComplete])

  const stopHintLoop = () => {
    hintLoopActiveRef.current = false
    clearTimeout(hintLoopTimerRef.current)
    hintLoopTimerRef.current = null
  }

  const startHintLoop = () => {
    hintLoopActiveRef.current = true
    const runLoop = () => {
      onRunHint(() => {
        if (!hintLoopActiveRef.current) return
        hintLoopTimerRef.current = setTimeout(runLoop, HINT_LOOP_DELAY)
      })
    }
    runLoop()
  }

  const handleCallback = (data) => {
    const { index, type, status } = data
    const stepId = STEPS[index]?.data?.id

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      stopHintLoop()
      if (compareActiveRef.current) {
        onDeactivateCompare()
        compareActiveRef.current = false
      }
      onClosePanel()
      onComplete()
      return
    }

    if (type === EVENTS.STEP_BEFORE) {
      if (stepId === 'zones')   startHintLoop()
      if (stepId === 'panel')   onOpenPanel()
      if (stepId === 'compare') {
        onActivateCompare()
        compareActiveRef.current = true
      }
    }

    if (type === EVENTS.STEP_AFTER) {
      if (stepId === 'zones')   stopHintLoop()
      if (stepId === 'compare') {
        onDeactivateCompare()
        compareActiveRef.current = false
      }
    }
  }

  const TooltipComponent = useMemo(
    () => (props) => <TourTooltip {...props} arrowType={arrowType} />,
    [arrowType]
  )

  return (
    <>
      {arrowType === 'line' && <TourConnectorLine />}
      <Joyride
        steps={STEPS}
        run={run}
        continuous
        scrollToFirstStep={false}
        showProgress={false}
        tooltipComponent={TooltipComponent}
        floaterProps={arrowType === 'line' ? { hideArrow: true } : {}}
        styles={arrowType === 'line' ? TOUR_STYLES_LINE : TOUR_STYLES}
        onEvent={handleCallback}
      />
    </>
  )
}

export default TourController
