import { LANGS, TYPES } from './manifest.js'

// Stremio paths: /manifest.json, /catalog/{type}/{id}.json, /catalog/{type}/{id}/{extra}.json
export function parseRoute(url) {
  let path
  try { path = decodeURIComponent(url.split('?')[0]) } catch { return null }
  if (path === '/manifest.json') return { kind: 'manifest' }
  const m = path.match(/^\/catalog\/([^/]+)\/in-([^/]+?)(?:\/([^/]+))?\.json$/)
  if (!m || !TYPES.includes(m[1]) || !(m[2] in LANGS)) return null
  const skip = Number.parseInt(new URLSearchParams(m[3] ?? '').get('skip'), 10)
  return { kind: 'catalog', type: m[1], lang: m[2], skip: skip > 0 ? skip : 0 }
}
