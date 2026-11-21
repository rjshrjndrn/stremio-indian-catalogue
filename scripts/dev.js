// Local server running the exact Vercel entry (api/index.js).
import http from 'node:http'
import app from '../api/index.js'

const port = Number(process.env.PORT ?? 3000)
http.createServer(async (req, res) => {
  const r = await app.fetch(new Request(`http://localhost:${port}${req.url}`))
  res.writeHead(r.status, Object.fromEntries(r.headers))
  res.end(await r.text())
}).listen(port, () => {
  console.log(`addon: http://localhost:${port}/manifest.json`)
  if (!process.env.TMDB_API_KEY) console.log('warning: TMDB_API_KEY not set (.env.local), catalogs will 500')
})
