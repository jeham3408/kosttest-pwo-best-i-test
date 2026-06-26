import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'

export {
  applyMetaToHtml,
  buildSitemapXml,
  getAllPrerenderRoutes,
  getPageMeta,
  normalizePath,
  parseRoute,
} from './routing'

export function render(path = '/') {
  return renderToString(
    <StrictMode>
      <App initialPath={path} />
    </StrictMode>,
  )
}
