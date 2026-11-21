import { manifest } from './manifest.js'
import { parseRoute } from './route.js'
import { pageAt } from './pager.js'

// Catalogs change daily at most: let the CDN serve them for 6h, then refresh in the background.
const CATALOG_CACHE = 'public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400'
const ERROR_CACHE = 'public, max-age=60'

// Platform-neutral: url -> { status, headers, body }. tmdb = createTmdb(...) or null if no key.
export async function handle(url, { tmdb }) {
  const route = parseRoute(url)
  if (!route) return json(404, { error: 'not found' })
  if (route.kind === 'manifest') return json(200, manifest, 'public, max-age=3600')
  if (!tmdb) return json(500, { error: 'TMDB_API_KEY is not set' }, ERROR_CACHE)
  try {
    const metas = await pageAt((p) => tmdb.page(route.type, route.lang, p), route.skip)
    return json(200, { metas }, CATALOG_CACHE)
  } catch (err) {
    return json(502, { error: String(err.message ?? err) }, ERROR_CACHE)
  }
}

function json(status, data, cache = ERROR_CACHE) {
  return {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': cache,
    },
    body: JSON.stringify(data),
  }
}
