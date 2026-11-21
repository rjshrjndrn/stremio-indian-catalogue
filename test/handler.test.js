import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handle } from '../src/handler.js'

const tmdbOk = {
  page: async (type, lang, p) => ({ items: [{ id: `tt${p}`, type, name: lang }] }),
}

test('manifest: 200 JSON with CORS and 8 catalogs', async () => {
  const r = await handle('/manifest.json', { tmdb: tmdbOk })
  assert.equal(r.status, 200)
  assert.equal(r.headers['Content-Type'], 'application/json; charset=utf-8')
  assert.equal(r.headers['Access-Control-Allow-Origin'], '*')
  const { catalogs } = JSON.parse(r.body)
  assert.equal(catalogs.length, 8)
  // Ids unchanged so existing installs keep working; names say what the row is.
  assert.deepEqual(catalogs[0], { type: 'movie', id: 'in-ml', name: 'Malayalam Trending', extra: [{ name: 'skip' }] })
})

test('catalog: metas from the TMDB page that skip points at, CDN-cached', async () => {
  const r = await handle('/catalog/movie/in-ml/skip=40.json', { tmdb: tmdbOk })
  assert.equal(r.status, 200)
  assert.deepEqual(JSON.parse(r.body), { metas: [{ id: 'tt3', type: 'movie', name: 'ml' }] })
  assert.match(r.headers['Cache-Control'], /s-maxage=21600/)
  assert.match(r.headers['Cache-Control'], /stale-while-revalidate/)
  assert.equal(r.headers['Access-Control-Allow-Origin'], '*')
})

test('unknown path: 404 JSON', async () => {
  const r = await handle('/meta/movie/tt1.json', { tmdb: tmdbOk })
  assert.equal(r.status, 404)
  assert.deepEqual(JSON.parse(r.body), { error: 'not found' })
})

test('TMDB failure: 502, short cache so it retries soon', async () => {
  const tmdb = { page: async () => { throw new Error('TMDB 401 /discover/movie') } }
  const r = await handle('/catalog/series/in-ta.json', { tmdb })
  assert.equal(r.status, 502)
  assert.match(r.headers['Cache-Control'], /max-age=60/)
  assert.doesNotMatch(r.headers['Cache-Control'], /s-maxage=21600/)
})

test('no TMDB configured: catalog 500 with a hint, manifest still works', async () => {
  const r = await handle('/catalog/movie/in-hi.json', { tmdb: null })
  assert.equal(r.status, 500)
  assert.match(JSON.parse(r.body).error, /TMDB_API_KEY/)
  assert.equal((await handle('/manifest.json', { tmdb: null })).status, 200)
})
