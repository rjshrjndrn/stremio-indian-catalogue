import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createTmdb } from '../src/tmdb.js'

// Fake TMDB: discover returns 3 titles; title 2 has no IMDb id.
function fakeFetch(log) {
  return async (url) => {
    const u = new URL(url)
    log.push(u)
    const json = (body) => ({ ok: true, status: 200, json: async () => body })
    if (u.pathname.startsWith('/3/discover/')) {
      return json({
        total_pages: 7,
        results: [
          { id: 1, title: 'A', name: 'A', poster_path: '/a.jpg', backdrop_path: '/ab.jpg', overview: 'oa', release_date: '2026-01-02', first_air_date: '2025-03-04' },
          { id: 2, title: 'B', name: 'B', poster_path: '/b.jpg' },
          { id: 3, title: 'C', name: 'C', poster_path: null },
        ],
      })
    }
    const id = u.pathname.split('/')[3]
    return json({ imdb_id: { 1: 'tt0000001', 2: null, 3: 'tt0000003' }[id] })
  }
}

test('movie page: discover params, imdb ids with tmdb fallback, meta mapping', async () => {
  const log = []
  const tmdb = createTmdb({ key: 'k'.repeat(32), fetch: fakeFetch(log), today: () => '2026-11-21' })
  const { items, totalPages } = await tmdb.page('movie', 'ml', 2)

  assert.equal(totalPages, 7)
  // Title 2 has no IMDb id: kept with a tmdb: id so pages stay 20 long.
  assert.deepEqual(items.map((m) => m.id), ['tt0000001', 'tmdb:2', 'tt0000003'])
  assert.deepEqual(items[0], {
    id: 'tt0000001', type: 'movie', name: 'A',
    poster: 'https://image.tmdb.org/t/p/w342/a.jpg',
    background: 'https://image.tmdb.org/t/p/w1280/ab.jpg',
    description: 'oa', releaseInfo: '2026',
  })
  assert.equal(items[2].poster, undefined)

  const d = log[0]
  assert.equal(d.pathname, '/3/discover/movie')
  assert.equal(d.searchParams.get('with_original_language'), 'ml')
  assert.equal(d.searchParams.get('region'), 'IN')
  assert.equal(d.searchParams.get('with_release_type'), '4')
  // Trending: most popular first, released (digitally, in India) in the last 90 days.
  assert.equal(d.searchParams.get('sort_by'), 'popularity.desc')
  assert.equal(d.searchParams.get('release_date.gte'), '2026-08-23')
  assert.equal(d.searchParams.get('release_date.lte'), '2026-11-21')
  assert.equal(d.searchParams.get('page'), '2')
  assert.equal(d.searchParams.get('api_key'), 'k'.repeat(32))
  assert.ok(log.slice(1).every((u) => /^\/3\/movie\/\d+\/external_ids$/.test(u.pathname)))
})

test('series page: discover/tv, popular shows with an episode aired in last 90 days', async () => {
  const log = []
  const tmdb = createTmdb({ key: 'k'.repeat(32), fetch: fakeFetch(log), today: () => '2026-11-21' })
  const { items } = await tmdb.page('series', 'ta', 1)

  assert.equal(items[0].type, 'series')
  assert.equal(items[0].releaseInfo, '2025')
  assert.equal(log[0].pathname, '/3/discover/tv')
  assert.equal(log[0].searchParams.get('sort_by'), 'popularity.desc')
  assert.equal(log[0].searchParams.get('air_date.gte'), '2026-08-23')
  assert.equal(log[0].searchParams.get('air_date.lte'), '2026-11-21')
  assert.ok(log.slice(1).every((u) => /^\/3\/tv\/\d+\/external_ids$/.test(u.pathname)))
})

test('v4 read token goes in Authorization header, not query', async () => {
  const calls = []
  const token = 'eyJ' + 'x'.repeat(200)
  const fetch = async (url, init) => { calls.push({ url: new URL(url), init }); return { ok: true, status: 200, json: async () => ({ results: [], total_pages: 1 }) } }
  await createTmdb({ key: token, fetch, today: () => '2026-11-21' }).page('movie', 'hi', 1)
  assert.equal(calls[0].url.searchParams.get('api_key'), null)
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${token}`)
})

test('TMDB error surfaces as thrown error', async () => {
  const fetch = async () => ({ ok: false, status: 401, json: async () => ({}) })
  await assert.rejects(createTmdb({ key: 'k', fetch }).page('movie', 'ml', 1), /TMDB 401/)
})
