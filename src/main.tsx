import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root')!
const initialPath = window.location.pathname || '/'
const app = (
  <StrictMode>
    <App initialPath={initialPath} />
  </StrictMode>
)

if (rootElement.innerHTML.includes('<!--app-html-->') || rootElement.innerHTML.trim() === '') {
  createRoot(rootElement).render(app)
} else {
  hydrateRoot(rootElement, app)
}
