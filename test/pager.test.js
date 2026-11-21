import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pageAt, PAGE_SIZE } from '../src/pager.js'

// Fake TMDB: fixed 20 items per page, 3 pages, last one short.
const TOTAL = 3
const pageItems = (p) => Array.from({ length: p < TOTAL ? PAGE_SIZE : 7 }, (_, i) => `p${p}-${i}`)
function source() {
  const calls = []
  const fetchPage = async (p) => { calls.push(p); return { items: p <= TOTAL ? pageItems(p) : [], totalPages: TOTAL } }
  return { calls, fetchPage }
}

test('skip=0 fetches only page 1', async () => {
  const s = source()
  assert.deepEqual(await pageAt(s.fetchPage, 0), pageItems(1))
  assert.deepEqual(s.calls, [1])
})

test('skip on page boundary jumps straight to that page', async () => {
  const s = source()
  assert.deepEqual(await pageAt(s.fetchPage, 40), pageItems(3))
  assert.deepEqual(s.calls, [3])
})

test('mid-page skip returns rest of that page', async () => {
  const s = source()
  assert.deepEqual(await pageAt(s.fetchPage, 25), pageItems(2).slice(5))
  assert.deepEqual(s.calls, [2])
})

test('skip past last page returns empty with one fetch', async () => {
  const s = source()
  assert.deepEqual(await pageAt(s.fetchPage, 60), [])
  assert.deepEqual(s.calls, [4])
})

test('scrolling like Nuvio (nextSkip = skip + items.length) sees every item once', async () => {
  const s = source()
  const seen = []
  for (let skip = 0, i = 0; i < 10; i++) {
    const items = await pageAt(s.fetchPage, skip)
    if (items.length === 0) break
    seen.push(...items)
    skip += items.length
  }
  assert.deepEqual(seen, [1, 2, 3].flatMap(pageItems))
})
