<script setup>
import { ref } from 'vue'
import { Search } from 'lucide-vue-next'
import LoadingDots from './LoadingDots.vue'
import { aiSearchQuery, openGoogleAiModeSearch } from '../../services/aiSearch.js'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  errorLabel: {
    type: String,
    required: true,
  },
  submitLabel: {
    type: String,
    required: true,
  },
  successLabel: {
    type: String,
    required: true,
  },
  loadingLabel: {
    type: String,
    required: true,
  },
})

const query = aiSearchQuery
const searching = ref(false)
const searchError = ref('')
const searchStatus = ref('')

function searchGoogleAi() {
  if (searching.value) return
  const searchQuery = query.value
  if (!searchQuery.trim()) return

  searching.value = true
  searchError.value = ''
  searchStatus.value = ''
  try {
    if (openGoogleAiModeSearch(searchQuery)) {
      query.value = ''
      searchStatus.value = props.successLabel
    } else {
      searchError.value = props.errorLabel
    }
  } catch {
    searchError.value = props.errorLabel
  } finally {
    searching.value = false
  }
}

function submitSearch() {
  if (!query.value.trim() || searching.value) return
  searchGoogleAi()
}
</script>

<template>
  <form
    v-bind="$attrs"
    class="header-search"
    role="search"
    :aria-busy="searching"
    @submit.prevent="submitSearch"
  >
    <Search
      :size="18"
      aria-hidden="true"
    />
    <input
      v-model="query"
      :aria-label="props.label"
      :placeholder="props.label"
      :disabled="searching"
    >
    <button
      class="search-submit ai-hover-button"
      type="submit"
      :disabled="searching || !query.trim()"
    >
      <template v-if="searching">
        {{ props.loadingLabel }}
        <LoadingDots />
      </template>
      <template v-else>
        {{ props.submitLabel }}
      </template>
    </button>
    <span
      v-if="searchError || searchStatus"
      class="header-search-message"
      :class="{ 'has-error': searchError }"
      :role="searchError ? 'alert' : 'status'"
    >
      {{ searchError || searchStatus }}
    </span>
  </form>
</template>
