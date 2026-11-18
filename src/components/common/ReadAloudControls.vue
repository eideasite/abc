<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
  language: { type: String, default: 'en' },
  labels: { type: Object, required: true },
})

const voices = ref([])
const selectedVoiceURI = ref('')
const rate = ref(1)
const status = ref('idle')
const chunkIndex = ref(0)
const chunks = ref([])
const progress = computed(() => chunks.value.length ? Math.round((chunkIndex.value / chunks.value.length) * 100) : 0)
const supported = computed(() => typeof window !== 'undefined'
  && Boolean(window.speechSynthesis)
  && typeof window.SpeechSynthesisUtterance === 'function')
const statusLabel = computed(() => {
  if (status.value === 'speaking') return `${props.labels.speaking} ${Math.min(chunkIndex.value + 1, chunks.value.length)} / ${chunks.value.length}`
  if (status.value === 'paused') return props.labels.paused
  if (status.value === 'finished') return props.labels.finished
  if (status.value === 'unsupported') return props.labels.unsupported
  if (status.value === 'error') return props.labels.failed
  return ''
})

let runId = 0

function splitIntoChunks(value, limit = 220) {
  const words = value.match(/\S+\s*/gu) || []
  const result = []
  let current = ''

  for (const word of words) {
    if (current && current.length + word.length > limit) {
      result.push(current.trim())
      current = ''
    }
    if (word.length > limit) {
      if (current) result.push(current.trim())
      const characters = Array.from(word)
      while (characters.length > limit) result.push(characters.splice(0, limit).join(''))
      current = characters.join('')
    } else {
      current += word
    }
  }

  if (current.trim()) result.push(current.trim())
  return result
}

function refreshVoices() {
  if (!supported.value) return
  voices.value = window.speechSynthesis.getVoices()
}

function speakChunk(id, index) {
  if (id !== runId) return
  if (index >= chunks.value.length) {
    status.value = 'finished'
    chunkIndex.value = chunks.value.length
    return
  }

  chunkIndex.value = index
  const utterance = new window.SpeechSynthesisUtterance(chunks.value[index])
  const locale = props.language === 'ta' ? 'ta-IN' : 'en-US'
  const voice = voices.value.find((item) => item.voiceURI === selectedVoiceURI.value)
    || voices.value.find((item) => item.lang?.toLowerCase().startsWith(locale.slice(0, 2).toLowerCase()))
  utterance.lang = voice?.lang || locale
  if (voice) utterance.voice = voice
  utterance.rate = rate.value
  utterance.onend = () => {
    if (id === runId) speakChunk(id, index + 1)
  }
  utterance.onerror = (event) => {
    if (id !== runId || event.error === 'canceled' || event.error === 'interrupted') return
    status.value = 'error'
  }

  try {
    window.speechSynthesis.speak(utterance)
  } catch {
    status.value = 'error'
  }
}

function play() {
  if (!supported.value) {
    status.value = 'unsupported'
    return
  }
  const text = props.text.trim()
  if (!text) return

  runId += 1
  window.speechSynthesis.cancel()
  chunks.value = splitIntoChunks(text)
  status.value = 'speaking'
  speakChunk(runId, 0)
}

function pause() {
  if (!supported.value || status.value !== 'speaking') return
  window.speechSynthesis.pause()
  status.value = 'paused'
}

function resume() {
  if (!supported.value || status.value !== 'paused') return
  window.speechSynthesis.resume()
  status.value = 'speaking'
}

function stop() {
  runId += 1
  if (supported.value) window.speechSynthesis.cancel()
  status.value = 'idle'
  chunks.value = []
  chunkIndex.value = 0
}

watch(() => props.text, stop)

onMounted(() => {
  refreshVoices()
  if (supported.value) window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)
})

onBeforeUnmount(() => {
  stop()
  if (supported.value) window.speechSynthesis.removeEventListener('voiceschanged', refreshVoices)
})
</script>

<template>
  <section
    class="read-aloud-controls"
    :aria-label="labels.readAloud"
  >
    <div class="read-aloud-actions">
      <button
        class="button button-secondary"
        type="button"
        :disabled="!text.trim() || status === 'speaking' || status === 'paused'"
        @click="play"
      >
        {{ labels.play }}
      </button>
      <button
        v-if="status === 'speaking'"
        class="button button-secondary"
        type="button"
        @click="pause"
      >
        {{ labels.pause }}
      </button>
      <button
        v-else-if="status === 'paused'"
        class="button button-secondary"
        type="button"
        @click="resume"
      >
        {{ labels.resume }}
      </button>
      <button
        class="button button-secondary"
        type="button"
        :disabled="status === 'idle' || status === 'finished' || status === 'unsupported'"
        @click="stop"
      >
        {{ labels.stop }}
      </button>
      <label
        v-if="voices.length"
        class="read-aloud-voice"
      >
        <span>{{ labels.voice }}</span>
        <select
          v-model="selectedVoiceURI"
          :disabled="status === 'speaking' || status === 'paused'"
          :aria-label="labels.voice"
        >
          <option value="">{{ labels.systemVoice }}</option>
          <option
            v-for="voice in voices"
            :key="voice.voiceURI"
            :value="voice.voiceURI"
          >
            {{ voice.name }} · {{ voice.lang }}
          </option>
        </select>
      </label>
      <label class="read-aloud-rate">
        <span>{{ labels.speed }} {{ rate.toFixed(2) }}×</span>
        <input
          v-model.number="rate"
          type="range"
          min="0.75"
          max="1.5"
          step="0.25"
          :aria-label="labels.speed"
          :disabled="status === 'speaking' || status === 'paused'"
        >
      </label>
    </div>
    <progress
      v-if="status === 'speaking' || status === 'paused' || status === 'finished'"
      class="read-aloud-progress"
      :value="progress"
      max="100"
      :aria-label="labels.progress"
    />
    <p
      v-if="statusLabel"
      class="read-aloud-status"
      role="status"
      aria-live="polite"
    >
      {{ statusLabel }}
    </p>
  </section>
</template>

<style scoped>
.read-aloud-controls { display: grid; min-width: 0; max-width: 100%; gap: 8px; margin-top: 14px; padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
.read-aloud-actions { display: flex; min-width: 0; max-width: 100%; align-items: center; flex-wrap: wrap; gap: 8px; }
.read-aloud-voice, .read-aloud-rate { display: flex; min-width: 0; max-width: 100%; align-items: center; gap: 8px; color: var(--muted); font-size: 0.82rem; }
.read-aloud-voice select { width: min(280px, 45vw); min-width: 0; max-width: 100%; min-height: 36px; }
.read-aloud-rate input { width: 100px; max-width: 100%; }
.read-aloud-progress { width: 100%; height: 6px; accent-color: var(--primary); }
.read-aloud-status { margin: 0; color: var(--muted); font-size: 0.84rem; }
@media (max-width: 700px) { .read-aloud-actions { align-items: stretch; } .read-aloud-voice, .read-aloud-rate { width: 100%; flex: 1 1 100%; justify-content: space-between; } .read-aloud-voice > span, .read-aloud-rate > span { min-width: 0; } .read-aloud-voice select { width: 58%; max-width: 58%; flex: 0 1 58%; } }
</style>
