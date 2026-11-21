export const LANGS = { ml: 'Malayalam', ta: 'Tamil', mr: 'Marathi', hi: 'Hindi' }
export const TYPES = ['movie', 'series']

export const manifest = {
  id: 'community.indian.catalogue',
  version: '0.1.0',
  name: 'Indian Catalogue',
  description: 'Latest Malayalam, Tamil, Marathi and Hindi movies (digital release in India) and series, from TMDB. IMDb ids where TMDB has them, so stream addons can find streams.',
  resources: ['catalog'],
  types: TYPES,
  catalogs: Object.entries(LANGS).flatMap(([code, name]) =>
    TYPES.map((type) => ({ type, id: `in-${code}`, name, extra: [{ name: 'skip' }] }))),
}
