<script setup lang="ts">
import { computed } from "vue";

interface Option {
  value: string | number;
  label: string;
}

const props = defineProps<{
  modelValue: string | number;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number): void;
}>();

const selectedOption = computed(() => {
  return props.options.find((option) => option.value === props.modelValue);
});
</script>

<template>
  <div class="space-y-2">
    <label v-if="label" class="block text-sm font-medium text-gray-700">{{
      label
    }}</label>
    <div class="relative flex-1">
      <select
        :value="modelValue"
        @input="
          emit(
            'update:modelValue',
            Number(($event.target as HTMLSelectElement).value) ||
              ($event.target as HTMLSelectElement).value
          )
        "
        :disabled="disabled"
        class="block w-full pl-3 pr-10 py-2 text-base border focus:outline-none sm:text-sm rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
        :class="{
          'border-red-300 focus:border-red-500 focus:ring-red-500': error,
        }">
        <option v-if="placeholder" value="" disabled selected>
          {{ placeholder }}
        </option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>
