import { useEffect } from 'react'
import { useBeforeAfter } from '../../hooks/useBeforeAfter.js'
const BeforeAfterSlider = ({ containerRef }) => {
  const { sliderHandlers } = useBeforeAfter(containerRef)

  useEffect(() => {
    containerRef.current?.style.setProperty('--slider-x', '50%')
  }, [containerRef])

  return (
    <div className="slider-handle" {...sliderHandlers}>
      <div className="handle-grip">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M5 4l-3 4 3 4M11 4l3 4-3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

export default BeforeAfterSlider
