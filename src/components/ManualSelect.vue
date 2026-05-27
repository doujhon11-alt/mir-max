<template>
  <div>
    <input
      class="input"
      :value="modelValue"
      :list="listId"
      :required="required"
      :placeholder="manualPlaceholder || placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <datalist :id="listId">
      <option v-for="option in normalizedOptions" :key="option" :value="option" />
    </datalist>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '' },
  manualPlaceholder: { type: String, default: 'Введите значение' },
  required: { type: Boolean, default: false }
});

defineEmits(['update:modelValue']);

const listId = `manual-select-${Math.random().toString(36).slice(2)}`;
const normalizedOptions = computed(() => Array.from(new Set(props.options.filter(Boolean).map(String))));
</script>

<style scoped>
.input { @apply w-full rounded border border-gray-300 px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500; }
</style>
