<script setup lang="ts">
interface Option {
  value: string | number;
  label: string;
}

defineProps<{
  modelValue: string | number;
  options: Option[];
  label?: string;
  required?: boolean;
  error?: string;
}>();

const emit = defineEmits(["update:modelValue"]);
</script>

<template>
  <div class="space-y-2">
    <label v-if="label" class="text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative">
      <select
        :value="modelValue"
        @change="
          emit('update:modelValue', ($event.target as HTMLSelectElement).value)
        "
        :required="required"
        :class="[
          'w-full p-2 pr-8 bg-white border rounded-md text-base appearance-none transition-colors',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500',
        ]">
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <div
        class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
        <svg
          class="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd" />
        </svg>
      </div>
    </div>
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>
