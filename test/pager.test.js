import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pageAt } from '../src/pager.js'

// Fake source: TMDB pages after tt-filtering. Page 3 lost every item.
const pages = {
  1: ['tt1', 'tt2', 'tt3'],
  2: ['tt4', 'tt5'],
  3: [],
  4: ['tt6'],
}
const totalPages = 4
const fetchPage = async (p) => ({ items: pages[p] ?? [], totalPages })

// Nuvio's rule: nextSkip = skip + items.length (CatalogData.kt). Walk it.
async function scrollAll() {
  const seen = []
  let skip = 0
  for (let i = 0; i < 10; i++) {
    const items = await pageAt(fetchPage, skip)
    if (items.length === 0) break
    seen.push(...items)
    skip += items.length
  }
  return seen
}

test('skip=0 returns first page', async () => {
  assert.deepEqual(await pageAt(fetchPage, 0), ['tt1', 'tt2', 'tt3'])
})

test('skip lands on next page boundary', async () => {
  assert.deepEqual(await pageAt(fetchPage, 3), ['tt4', 'tt5'])
})

test('fully-filtered page is skipped, not returned empty', async () => {
  assert.deepEqual(await pageAt(fetchPage, 5), ['tt6'])
})

test('skip past end returns empty', async () => {
  assert.deepEqual(await pageAt(fetchPage, 6), [])
})

test('mid-page skip returns rest of that page', async () => {
  assert.deepEqual(await pageAt(fetchPage, 1), ['tt2', 'tt3'])
})

test('scrolling like Nuvio sees every item once, in order', async () => {
  assert.deepEqual(await scrollAll(), ['tt1', 'tt2', 'tt3', 'tt4', 'tt5', 'tt6'])
})
