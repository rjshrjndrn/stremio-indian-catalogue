export const LANGS = { ml: 'Malayalam', ta: 'Tamil', mr: 'Marathi', hi: 'Hindi' }
export const TYPES = ['movie', 'series']

export const manifest = {
  id: 'community.indian.catalogue',
  version: '0.1.0',
  name: 'Indian Catalogue',
  description: 'Latest Malayalam, Tamil, Marathi and Hindi movies (digital release in India) and series, from TMDB. IMDb ids only, so stream addons can find them.',
  resources: ['catalog'],
  types: TYPES,
  idPrefixes: ['tt'],
  catalogs: Object.entries(LANGS).flatMap(([code, name]) =>
    TYPES.map((type) => ({ type, id: `in-${code}`, name, extra: [{ name: 'skip' }] }))),
}
