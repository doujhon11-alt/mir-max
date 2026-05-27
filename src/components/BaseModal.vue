<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div class="w-full max-w-2xl rounded-lg bg-white shadow-xl">
      <div class="flex items-center justify-between border-b px-5 py-4">
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
        <button type="button" class="text-2xl leading-none text-gray-400 hover:text-gray-700" @click="$emit('close')">
          &times;
        </button>
      </div>
      <div class="max-h-[75vh] overflow-y-auto p-5">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  }
});

defineEmits(['close']);
</script>
