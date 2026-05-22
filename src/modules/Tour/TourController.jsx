import { useState, useEffect, useRef } from 'react'
import { Joyride, EVENTS, STATUS } from 'react-joyride'

const TOUR_STYLES = {
  options: {
    arrowColor: '#222',
    backgroundColor: '#222',
    overlayColor: 'rgba(0,0,0,0.55)',
    primaryColor: 'hsl(354,73%,46%)',
    textColor: '#f0f0f0',
    zIndex: 10000,
    width: 280,
  },
  tooltip: {
    backgroundColor: '#222',
    borderRadius: '8px',
    color: '#f0f0f0',
    fontSize: '0.875rem',
    padding: '16px 20px',
  },
  tooltipContainer: { textAlign: 'left' },
  tooltipContent: { padding: '8px 0 0' },
  buttonNext: { backgroundColor: 'hsl(354,73%,46%)', borderRadius: '4px', fontSize: '0.8rem', color: '#fff' },
  buttonBack: { color: '#aaa', fontSize: '0.8rem' },
  buttonSkip: { color: '#bbb', fontSize: '0.8rem', textDecoration: 'underline' },
  buttonClose: { color: '#aaa' },
}

const buildSteps = () => {
  const base = {
    disableBeacon: true,
    buttons: ['back', 'close', 'primary', 'skip'],
    closeButtonAction: 'skip',
    dismissKeyAction: false,
    overlayClickAction: false,
  }

  return [
    {
      ...base,
      target: '.ambient-viewer',
      placement: 'center',
      content: 'Te mostramos cómo funciona el configurador en unos segundos.',
      data: { id: 'welcome' },
    },
    {
      ...base,
      target: '.ambient-viewer',
      placement: 'center',
      content: 'Toca en la zona que quieres personalizar.',
      data: { id: 'zones' },
    },
    {
      ...base,
      target: '.product-panel',
      placement: 'left',
      content: 'Elige modelo y color. Los cambios se reflejan en tiempo real.',
      data: { id: 'panel' },
    },
    {
      ...base,
      target: '.ui-actions button:first-child',
      placement: 'top',
      content: 'Activa la comparativa para ver dos opciones a la vez. Arrastra el divisor.',
      data: { id: 'compare' },
    },
    {
      ...base,
      target: 'button[aria-label="Descarga tu ambiente"]',
      placement: 'top',
      content: 'Descarga una imagen o PDF con tu selección actual.',
      data: { id: 'download' },
    },
    {
      ...base,
      target: 'button[aria-label="Información del producto"]',
      placement: 'top',
      content: 'Consulta en cualquier momento el modelo y color seleccionados.',
      data: { id: 'info' },
    },
    {
      ...base,
      target: 'button[aria-label="Volver"]',
      placement: 'top',
      content: 'Vuelve a la página anterior cuando quieras.',
      data: { id: 'back' },
    },
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
  const compareActiveRef = useRef(false)
  const hintLoopTimerRef = useRef(null)

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
    clearTimeout(hintLoopTimerRef.current)
    hintLoopTimerRef.current = null
  }

  const startHintLoop = () => {
    onRunHint(() => {
      hintLoopTimerRef.current = setTimeout(startHintLoop, HINT_LOOP_DELAY)
    })
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
        onClosePanel()
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
      locale={{ next: 'Siguiente', last: 'Terminar tour', skip: 'Salir del tour', back: 'Atrás', close: 'Cerrar' }}
      styles={TOUR_STYLES}
      onEvent={handleCallback}
    />
  )
}

export default TourController
