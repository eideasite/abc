import assert from 'node:assert/strict'
import test from 'node:test'
import { AI_PROVIDERS, buildGoogleAiModeUrl, openAiProviderTabs, openGoogleAiModeSearch } from '../src/services/aiSearch.js'

function installBrowserMocks({ blockedIndexes = [], clipboard = async () => {} } = {}) {
  const openedUrls = []
  const copiedText = []
  globalThis.window = {
    open(url) {
      const index = openedUrls.length
      openedUrls.push(url)
      return blockedIndexes.includes(index) ? null : { opener: null, closed: false }
    },
    setTimeout(callback, delay) { return setTimeout(callback, delay) },
    clearTimeout(id) { clearTimeout(id) },
  }
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { clipboard: { writeText: async (text) => { copiedText.push(text); return clipboard() } } },
  })
  return { openedUrls, copiedText }
}

test('AI tab launch hands off the exact prompt in a URL fragment and copies once', async () => {
  const prompt = 'Tamil question?\nSecond line & symbols #1'
  const { openedUrls, copiedText } = installBrowserMocks()

  const result = await openAiProviderTabs(prompt, [AI_PROVIDERS[0]])

  assert.deepEqual(result, { opened: 1, total: 1, copied: true })
  assert.equal(new URL(openedUrls[0]).origin, 'https://gemini.google.com')
  assert.equal(new URLSearchParams(new URL(openedUrls[0]).hash.slice(1)).get('jeyamohan_prompt'), prompt)
  assert.deepEqual(copiedText, [prompt])
})

test('AI tab launch keeps successful tabs when one popup is blocked', async () => {
  const { openedUrls } = installBrowserMocks({ blockedIndexes: [1] })

  const result = await openAiProviderTabs('hello')

  assert.deepEqual(result, { opened: 2, total: 3, copied: true })
  assert.equal(openedUrls.length, 3)
})

test('AI tab launch times out clipboard access instead of waiting forever', async () => {
  const openedUrls = []
  globalThis.window = {
    open(url) { openedUrls.push(url); return { opener: null, closed: false } },
    setTimeout(callback) { callback(); return 1 },
    clearTimeout() {},
  }
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { clipboard: { writeText: () => new Promise(() => {}) } },
  })

  const result = await openAiProviderTabs('hello', [AI_PROVIDERS[0]])

  assert.deepEqual(result, { opened: 1, total: 1, copied: false })
})

test('Google AI search opens Google Search AI Mode with the exact query', () => {
  const openedUrls = []
  globalThis.window = {
    open(url) {
      openedUrls.push(url)
      return { opener: window, closed: false }
    },
  }
  const query = 'ulāippāli songs & meaning'

  assert.equal(openGoogleAiModeSearch(`  ${query}  `), true)
  assert.equal(openedUrls.length, 1)
  const url = new URL(openedUrls[0])
  assert.equal(url.origin, 'https://www.google.com')
  assert.equal(url.pathname, '/search')
  assert.equal(url.searchParams.get('udm'), '50')
  assert.equal(url.searchParams.get('q'), query)
  assert.equal(buildGoogleAiModeUrl('  ').includes('q='), true)
})

test('Google AI search keeps the query when the browser blocks the tab', () => {
  globalThis.window = { open: () => null }

  assert.equal(openGoogleAiModeSearch('question'), false)
  assert.equal(openGoogleAiModeSearch('  '), false)
})
