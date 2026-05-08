import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './style.css'


const rootElement = document.getElementById('ambient_viewer')


createRoot(rootElement).render(
  <StrictMode>
      <App/>
  </StrictMode>
)
