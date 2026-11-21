// Maps a Stremio `skip` offset onto TMDB pages whose items were filtered
// (titles without IMDb ids dropped), so page sizes vary. Returns the rest of
// the page containing `skip`; the client's nextSkip = skip + items.length then
// lands exactly on the next page boundary. Empty pages are skipped because an
// empty response makes clients stop paging.
// fetchPage(p) -> { items, totalPages }, p is 1-based.
export async function pageAt(fetchPage, skip = 0) {
  let offset = skip
  for (let p = 1; ; p++) {
    const { items, totalPages } = await fetchPage(p)
    if (offset < items.length) return items.slice(offset)
    offset -= items.length
    if (p >= totalPages) return []
  }
}
