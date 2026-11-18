const PROMPT_PARAMETER = 'jeyamohan_prompt'
const COMPOSER_SELECTORS = [
  'textarea[data-testid*="prompt"]',
  'textarea#prompt-textarea',
  '[contenteditable="true"][data-testid*="composer"]',
  '[contenteditable="true"][data-placeholder]',
  '[contenteditable="true"][role="textbox"]',
  'textarea',
  'input[type="text"]',
]
const SEND_SELECTORS = [
  'button[data-testid="send-button"]',
  'button[aria-label*="Send" i]',
  'button[aria-label*="Submit" i]',
  'button[type="submit"]',
]

function readPromptFromHash() {
  const params = new URLSearchParams(window.location.hash.slice(1))
  const prompt = params.get(PROMPT_PARAMETER)
  if (!prompt) return ''

  const cleanUrl = new URL(window.location.href)
  cleanUrl.hash = ''
  history.replaceState(history.state, '', cleanUrl.toString())
  return prompt
}

function queryDeep(root, selector, results = []) {
  results.push(...root.querySelectorAll(selector))
  for (const element of root.querySelectorAll('*')) {
    if (element.shadowRoot) queryDeep(element.shadowRoot, selector, results)
  }
  return results
}

function isVisible(element) {
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
    && !element.disabled
    && element.getAttribute('aria-disabled') !== 'true'
}

function findComposer() {
  const candidates = queryDeep(document, COMPOSER_SELECTORS.join(',')).filter(isVisible)
  const score = (element) => {
    const label = [
      element.getAttribute('aria-label'),
      element.getAttribute('placeholder'),
      element.getAttribute('data-placeholder'),
      element.id,
    ].join(' ').toLowerCase()
    if (/prompt|message|ask|chat|question/.test(label)) return 2
    if (/search|filter/.test(label)) return -1
    return 0
  }
  return candidates.sort((left, right) => score(right) - score(left))[0] || null
}

function setComposerText(composer, prompt) {
  composer.focus()
  if (composer.isContentEditable || composer.getAttribute('contenteditable') === 'true') {
    composer.replaceChildren(document.createTextNode(prompt))
    composer.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      composed: true,
      inputType: 'insertText',
      data: prompt,
    }))
    return
  }

  const prototype = Object.getPrototypeOf(composer)
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
  if (valueSetter) valueSetter.call(composer, prompt)
  else composer.value = prompt
  composer.dispatchEvent(new Event('input', { bubbles: true }))
  composer.dispatchEvent(new Event('change', { bubbles: true }))
}

function findSendButton(composer) {
  const form = composer.closest('form')
  const candidates = SEND_SELECTORS.flatMap((selector) => queryDeep(form || document, selector))
  return candidates.find(isVisible) || null
}

function showStatus(message, failed = false) {
  const existing = document.getElementById('jeyamohan-prompt-handoff-status')
  existing?.remove()
  const status = document.createElement('div')
  status.id = 'jeyamohan-prompt-handoff-status'
  status.textContent = message
  Object.assign(status.style, {
    position: 'fixed',
    top: '16px',
    right: '16px',
    zIndex: '2147483647',
    maxWidth: 'min(360px, calc(100vw - 32px))',
    padding: '10px 14px',
    borderRadius: '10px',
    color: '#fff',
    background: failed ? '#9b2c2c' : '#176b45',
    boxShadow: '0 6px 24px rgba(0,0,0,.22)',
    font: '14px/1.4 system-ui, sans-serif',
  })
  document.documentElement.append(status)
  window.setTimeout(() => status.remove(), 7000)
}

async function handoffPrompt(prompt) {
  let composer = null
  for (let attempt = 0; attempt < 60 && !composer; attempt += 1) {
    composer = findComposer()
    if (!composer) await new Promise((resolve) => window.setTimeout(resolve, 250))
  }

  if (!composer) {
    showStatus('Could not find the AI prompt box. Paste your copied prompt manually.', true)
    return
  }

  setComposerText(composer, prompt)
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 150))
    const sendButton = findSendButton(composer)
    if (sendButton) {
      sendButton.click()
      showStatus('Prompt sent to this AI.')
      return
    }
  }

  showStatus('Prompt filled in. Press Send to submit it.', true)
}

const prompt = readPromptFromHash()
if (prompt && !window.__jeyamohanPromptHandoffStarted) {
  window.__jeyamohanPromptHandoffStarted = true
  void handoffPrompt(prompt)
}
