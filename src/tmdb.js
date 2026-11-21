const API = 'https://api.themoviedb.org/3'
const IMG = 'https://image.tmdb.org/t/p'

export function createTmdb({ key, fetch = globalThis.fetch, today = () => new Date().toISOString().slice(0, 10) }) {
  // v4 read-access tokens are JWTs; v3 keys are 32 hex chars.
  const bearer = key.length > 40
  async function get(path, params = {}) {
    const url = new URL(API + path)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    if (!bearer) url.searchParams.set('api_key', key)
    const res = await fetch(url, bearer ? { headers: { Authorization: `Bearer ${key}` } } : undefined)
    if (!res.ok) throw new Error(`TMDB ${res.status} ${path}`)
    return res.json()
  }

  async function page(type, lang, p) {
    const tv = type === 'series'
    const params = tv
      ? { sort_by: 'first_air_date.desc', 'first_air_date.lte': today() }
      // Digital (OTT) release in India, so streams likely exist.
      : { sort_by: 'primary_release_date.desc', region: 'IN', with_release_type: '4', 'release_date.lte': today() }
    const data = await get(`/discover/${tv ? 'tv' : 'movie'}`, { with_original_language: lang, page: p, ...params })
    const ids = await Promise.all(data.results.map((r) =>
      get(`/${tv ? 'tv' : 'movie'}/${r.id}/external_ids`).then((x) => x.imdb_id, () => null)))
    // No IMDb id: keep as tmdb:<id> so pages stay 20 long (stream addons may find nothing).
    const items = data.results.map((r, i) => toMeta(type, r, ids[i] ?? `tmdb:${r.id}`))
    return { items, totalPages: data.total_pages ?? 1 }
  }

  return { page }
}

function toMeta(type, r, imdbId) {
  const released = type === 'series' ? r.first_air_date : r.release_date
  return {
    id: imdbId,
    type,
    name: r.title ?? r.name,
    poster: r.poster_path ? `${IMG}/w342${r.poster_path}` : undefined,
    background: r.backdrop_path ? `${IMG}/w1280${r.backdrop_path}` : undefined,
    description: r.overview || undefined,
    releaseInfo: released ? released.slice(0, 4) : undefined,
  }
}
