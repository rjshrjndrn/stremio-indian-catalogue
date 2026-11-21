import { handle } from '../src/handler.js'
import { createTmdb } from '../src/tmdb.js'

// Vercel Node function (Web fetch signature). vercel.json rewrites every path
// here; request.url keeps the original path, e.g. /catalog/movie/in-ml.json.
export default {
  async fetch(request) {
    const key = process.env.TMDB_API_KEY
    const { pathname, search } = new URL(request.url)
    const r = await handle(pathname + search, { tmdb: key ? createTmdb({ key }) : null })
    return new Response(r.body, { status: r.status, headers: r.headers })
  },
}
