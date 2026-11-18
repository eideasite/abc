<template>
  <span
    class="loading-dots loading-task-hunter"
    aria-hidden="true"
  >
    <Bird
      :size="18"
      :stroke-width="2.4"
    />
  </span>
</template>

<script setup>
import { Bird } from 'lucide-vue-next'
</script>
