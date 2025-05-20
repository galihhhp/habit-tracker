<script setup lang="ts">
defineProps<{
  modelValue: string;
  label?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  error?: string;
  loading?: boolean;
}>();

const emit = defineEmits(["update:modelValue"]);
</script>

<template>
  <div class="space-y-2">
    <label v-if="label" class="text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
      <span v-if="loading" class="ml-2 text-sm text-gray-500"
        >Generating...</span
      >
    </label>

    <input
      :value="modelValue"
      @input="
        emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
      :type="type || 'text'"
      :placeholder="placeholder"
      :required="required"
      :disabled="loading"
      :class="[
        'w-full p-2 border rounded-md text-base transition-colors',
        error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500',
        loading ? 'bg-gray-50' : '',
      ]" />
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>
