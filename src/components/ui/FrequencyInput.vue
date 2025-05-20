<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Select from "./Select.vue";

interface Frequency {
  times: number;
  period: "week";
}

const props = defineProps<{
  modelValue: Frequency;
  error?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: Frequency): void;
}>();

const times = ref(props.modelValue.times);

const frequencyOptions = [
  { value: 1, label: "1 time per week" },
  { value: 2, label: "2 times per week" },
  { value: 3, label: "3 times per week" },
  { value: 4, label: "4 times per week" },
  { value: 5, label: "5 times per week" },
  { value: 6, label: "6 times per week" },
  { value: 7, label: "7 times per week" },
];

watch(times, () => {
  emit("update:modelValue", {
    times: Number(times.value),
    period: "week",
  });
});

watch(
  () => props.modelValue,
  (newValue) => {
    times.value = Number(newValue.times);
  },
  { deep: true }
);
</script>

<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-gray-700">Frequency</label>
    <Select
      v-model.number="times"
      :options="frequencyOptions"
      :error="error"
      label="How many times per week?" />
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>
