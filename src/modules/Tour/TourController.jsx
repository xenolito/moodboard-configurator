import { useState, useEffect, useRef } from 'react'
import { Joyride, EVENTS, STATUS } from 'react-joyride'
import { ArrowRight } from 'lucide-react'

const TOUR_STYLES = {
  options: {
    arrowColor: '#222',
    overlayColor: 'rgba(0,0,0,0.55)',
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
}) => (
  <div {...tooltipProps} className="tour-tooltip">
    <button {...closeProps} className="tour-tooltip-close" aria-label="Cerrar" title="Cerrar">✕</button>
    <div className="tour-tooltip-body">{step.content}</div>
    <div className="tour-tooltip-footer">
      <div className="tour-tooltip-left">
        <button {...skipProps} className="tour-tooltip-btn-skip" aria-label="Salir del tour" title="Salir del tour">Salir del tour</button>
      </div>
      <button {...primaryProps} className="tour-tooltip-btn-next" aria-label={isLastStep ? 'Terminar tour' : 'Siguiente'} title={isLastStep ? 'Terminar tour' : 'Siguiente'}>
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
    { ...base, target: '.ambient-viewer',                               placement: 'center', content: 'Te mostramos cómo funciona el configurador en unos segundos.',      data: { id: 'welcome'  } },
    { ...base, target: '.ambient-viewer',                               placement: 'center', content: 'Toca en la zona que quieres personalizar.',                         data: { id: 'zones'    } },
    { ...base, target: '.product-panel',                                placement: 'left',   content: 'Elige modelo y color. Los cambios se reflejan en tiempo real.',      data: { id: 'panel'    } },
    { ...base, target: '.ui-actions button:first-child',                placement: 'top',    content: 'Activa la comparativa para ver dos opciones a la vez. Arrastra el divisor.', data: { id: 'compare'  } },
    { ...base, target: 'button[aria-label="Descarga tu ambiente"]',     placement: 'top',    content: 'Descarga una imagen o PDF con tu selección actual.',                data: { id: 'download' } },
    { ...base, target: 'button[aria-label="Información del producto"]', placement: 'top',    content: 'Consulta en cualquier momento el modelo y color seleccionados.',    data: { id: 'info'     } },
    { ...base, target: 'button[aria-label="Volver"]',                   placement: 'top',    content: 'Vuelve a la página anterior cuando quieras.',                       data: { id: 'back'     } },
  ]
}

const STEPS = buildSteps()

const HINT_LOOP_DELAY = 600

const TourController = ({
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

  return (
    <Joyride
      steps={STEPS}
      run={run}
      continuous
      scrollToFirstStep={false}
      showProgress={false}
      tooltipComponent={TourTooltip}
      styles={TOUR_STYLES}
      onEvent={handleCallback}
    />
  )
}

export default TourController
