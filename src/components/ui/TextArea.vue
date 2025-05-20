<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  modelValue: string;
  label?: string;
  placeholder?: string;
  rows?: number;
  error?: string;
  maxLength?: number;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const charCount = computed(() => props.modelValue?.length || 0);
const isNearLimit = computed(() => {
  if (!props.maxLength) return false;
  return charCount.value > props.maxLength * 0.8;
});
const isAtLimit = computed(() => {
  if (!props.maxLength) return false;
  return charCount.value >= props.maxLength;
});
</script>

<template>
  <div class="space-y-2">
    <div class="flex justify-between items-center">
      <label v-if="label" class="block text-sm font-medium text-gray-700">{{
        label
      }}</label>
      <span
        v-if="maxLength"
        class="text-xs"
        :class="{
          'text-gray-500': !isNearLimit,
          'text-yellow-600': isNearLimit && !isAtLimit,
          'text-red-600': isAtLimit,
        }">
        {{ charCount }}/{{ maxLength }}
      </span>
    </div>
    <textarea
      :value="modelValue"
      @input="
        emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)
      "
      :rows="rows || 3"
      :maxlength="maxLength"
      class="w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-gray-800 focus:ring-gray-800"
      :class="{
        'border-red-300 focus:border-red-500 focus:ring-red-500': error,
        'border-yellow-300 focus:border-yellow-500':
          isNearLimit && !isAtLimit && !error,
        'border-red-300 focus:border-red-500': isAtLimit && !error,
      }"
      :placeholder="placeholder" />
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>
