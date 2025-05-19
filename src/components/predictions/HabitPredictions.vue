<script setup lang="ts">
import type { Habit } from "@/services/db";

defineProps<{
  predictions: NonNullable<Habit["predictions"]>;
}>();
</script>

<template>
  <div class="mt-6">
    <h4 class="text-lg font-medium text-gray-900 mb-4">Your Journey Ahead</h4>

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
</template>
