import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseRoute } from '../src/route.js'

test('manifest', () => {
  assert.deepEqual(parseRoute('/manifest.json'), { kind: 'manifest' })
})

test('catalog without extra', () => {
  assert.deepEqual(parseRoute('/catalog/movie/in-ml.json'),
    { kind: 'catalog', type: 'movie', lang: 'ml', skip: 0 })
})

test('catalog with skip extra', () => {
  assert.deepEqual(parseRoute('/catalog/series/in-ta/skip=40.json'),
    { kind: 'catalog', type: 'series', lang: 'ta', skip: 40 })
})

test('url-encoded extra and query string', () => {
  assert.deepEqual(parseRoute('/catalog/movie/in-hi/skip%3D20.json?x=1'),
    { kind: 'catalog', type: 'movie', lang: 'hi', skip: 20 })
})

test('unknown language, type or path -> null', () => {
  assert.equal(parseRoute('/catalog/movie/in-xx.json'), null)
  assert.equal(parseRoute('/catalog/channel/in-ml.json'), null)
  assert.equal(parseRoute('/meta/movie/tt1.json'), null)
})

test('malformed percent-encoding -> null, not a crash', () => {
  assert.equal(parseRoute('/catalog/movie/in-ml/skip%E0%A4.json'), null)
})

test('garbage skip falls back to 0', () => {
  assert.equal(parseRoute('/catalog/movie/in-ml/skip=abc.json').skip, 0)
})
