import './Spinner.css'

const Spinner = ({ size = 24 }) => (
  <svg className="spinner" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
  </svg>
)

export default Spinner
