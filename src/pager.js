// TMDB discover pages are a fixed 20 items (no filtering on our side), so a
// Stremio `skip` maps straight to one page: one TMDB fetch per request however
// deep the user scrolls. Returning the rest of that page keeps the client's
// nextSkip = skip + items.length on page boundaries.
export const PAGE_SIZE = 20

// fetchPage(p) -> { items }, p is 1-based.
export async function pageAt(fetchPage, skip = 0) {
  const { items } = await fetchPage(Math.floor(skip / PAGE_SIZE) + 1)
  return items.slice(skip % PAGE_SIZE)
}
