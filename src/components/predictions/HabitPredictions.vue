<script setup lang="ts">
import type { Habit } from "@/services/db";
import { ref } from "vue";

defineProps<{
  predictions: NonNullable<Habit["predictions"]>;
}>();

const isExpanded = ref(false);

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};
</script>

<template>
  <div class="mt-6">
    <div class="flex justify-between items-center mb-4">
      <h4 class="text-lg font-medium text-gray-900">Your Journey Ahead</h4>
      <button
        @click="toggleExpand"
        class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
        {{ isExpanded ? "Collapse" : "Expand" }}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 transform transition-all duration-300 ease-in-out"
          :class="{ 'rotate-180': isExpanded }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <div
      class="overflow-hidden transition-all duration-300 ease-in-out"
      :style="{
        maxHeight: isExpanded ? '1000px' : '0',
        opacity: isExpanded ? '1' : '0',
        marginTop: isExpanded ? '1rem' : '0',
      }">
      <div class="space-y-6">
        <div
          v-for="milestone in predictions.milestones"
          :key="milestone.period"
          class="bg-gray-50 p-4 rounded-lg">
          <h5 class="font-medium text-gray-900 mb-3 text-lg">
            After {{ milestone.period }}
          </h5>
          <p class="text-gray-600">{{ milestone.prediction }}</p>
        </div>

        <div class="bg-blue-50 p-4 rounded-lg">
          <h5 class="font-medium text-blue-900 mb-3 text-lg">
            When You Reach Your Goal
          </h5>
          <p class="text-blue-600">{{ predictions.targetPrediction }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
