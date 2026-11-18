import assert from 'node:assert/strict'
import test from 'node:test'
import {
  loadBookmarkedArticleIds,
  saveBookmarkedArticleIds,
} from '../src/services/articleReferenceStorage.js'

const values = new Map()
globalThis.localStorage = {
  getItem(key) { return values.has(key) ? values.get(key) : null },
  setItem(key, value) { values.set(key, String(value)) },
  removeItem(key) { values.delete(key) },
}

test('bookmark updates repair duplicate or malformed legacy storage', () => {
  const key = 'jeyamohan-article-bookmarks-v1'

  values.set(key, '["article-1", "article-1"]')
  assert.equal(saveBookmarkedArticleIds(['article-1']), true)
  assert.deepEqual(loadBookmarkedArticleIds(), ['article-1'])

  values.set(key, '{broken json')
  assert.deepEqual(loadBookmarkedArticleIds(), [])
  assert.equal(saveBookmarkedArticleIds(['article-2']), true)
  assert.deepEqual(loadBookmarkedArticleIds(), ['article-2'])
})

test('bookmark storage rejects invalid new IDs without replacing the saved list', () => {
  const key = 'jeyamohan-article-bookmarks-v1'
  values.set(key, '["article-2"]')

  assert.equal(saveBookmarkedArticleIds(['', 42]), false)
  assert.deepEqual(loadBookmarkedArticleIds(), ['article-2'])
})
