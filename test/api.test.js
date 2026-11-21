import { test } from 'node:test'
import assert from 'node:assert/strict'
import app from '../api/index.js'

test('vercel entry serves manifest from the rewritten original path', async () => {
  const res = await app.fetch(new Request('https://x.vercel.app/manifest.json'))
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('access-control-allow-origin'), '*')
  assert.equal((await res.json()).catalogs.length, 8)
})

test('vercel entry without TMDB_API_KEY: catalog explains missing key', async () => {
  const saved = process.env.TMDB_API_KEY
  delete process.env.TMDB_API_KEY
  try {
    const res = await app.fetch(new Request('https://x.vercel.app/catalog/movie/in-ml.json'))
    assert.equal(res.status, 500)
    assert.match((await res.json()).error, /TMDB_API_KEY/)
  } finally {
    if (saved !== undefined) process.env.TMDB_API_KEY = saved
  }
})
