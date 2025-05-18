<script setup lang="ts">
import { computed } from "vue";
import Modal from "../ui/Modal.vue";
import Calendar from "../ui/Calendar.vue";
import type { CheckIn } from "@/services/db";

const props = defineProps<{
  isOpen: boolean;
  habitHistory: CheckIn[];
  analytics: {
    weekly: {
      completions: number;
      adherence: number;
      target: number;
    };
    allTime: {
      completions: number;
      adherence: number;
      longestStreak: number;
    };
  };
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const historyStart = computed(() => {
  const today = new Date();
  const start = new Date(today);
  start.setMonth(today.getMonth() - 1);
  start.setHours(0, 0, 0, 0);
  return start;
});

const historyEnd = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
});
</script>

<template>
  <Modal
    :is-open="isOpen"
    title="Habit History & Analytics"
    @close="emit('close')">
    <div class="space-y-8">
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          This Week's Progress
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-gray-900">
              {{ analytics.weekly.completions }}/{{ analytics.weekly.target }}
            </div>
            <div class="text-sm text-gray-600">Weekly Target</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-gray-900">
              {{ analytics.weekly.adherence }}%
            </div>
            <div class="text-sm text-gray-600">Weekly Success Rate</div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Last 30 Days Overview
        </h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-gray-900">
              {{ analytics.allTime.completions }}
            </div>
            <div class="text-sm text-gray-600">Total Completions</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-gray-900">
              {{ analytics.allTime.adherence }}%
            </div>
            <div class="text-sm text-gray-600">Overall Success Rate</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-gray-900">
              {{ analytics.allTime.longestStreak }}
            </div>
            <div class="text-sm text-gray-600">Longest Streak</div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Monthly Calendar</h3>
        <Calendar
          :check-ins="habitHistory"
          :start-date="historyStart"
          :end-date="historyEnd"
          :show-week-days="true"
          :is-editable="false" />
      </div>
    </div>
  </Modal>
</template>
