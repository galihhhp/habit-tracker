<script setup lang="ts">
import Modal from "../layout/Modal.vue";
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
</script>

<template>
  <Modal
    :is-open="props.isOpen"
    @close="emit('close')"
    title="Habit History"
    size="md">
    <div class="space-y-6">
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-3">
          Weekly Performance
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">Completions</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ props.analytics.weekly.completions }}/{{
                    props.analytics.weekly.target
                  }}
                </p>
              </div>
              <div class="p-2 rounded-full border border-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-gray-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div class="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-gray-700 transition-all duration-300"
                :style="{
                  width: `${Math.min(
                    100,
                    (props.analytics.weekly.completions /
                      props.analytics.weekly.target) *
                      100 || 0
                  )}%`,
                }"></div>
            </div>
          </div>

          <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">Adherence Rate</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ props.analytics.weekly.adherence }}%
                </p>
              </div>
              <div class="p-2 rounded-full border border-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-gray-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div class="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-gray-700 transition-all duration-300"
                :style="{
                  width: `${props.analytics.weekly.adherence}%`,
                }"></div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-3">
          All-Time Achievements
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p class="text-sm text-gray-500">Total Completions</p>
            <div class="flex items-center mt-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-gray-700 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-2xl font-bold text-gray-900">
                {{ props.analytics.allTime.completions }}
              </p>
            </div>
          </div>

          <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p class="text-sm text-gray-500">Overall Adherence</p>
            <div class="flex items-center mt-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-gray-700 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              <p class="text-2xl font-bold text-gray-900">
                {{ props.analytics.allTime.adherence }}%
              </p>
            </div>
          </div>

          <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p class="text-sm text-gray-500">Longest Streak</p>
            <div class="flex items-center mt-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-gray-700 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p class="text-2xl font-bold text-gray-900">
                {{ props.analytics.allTime.longestStreak }} days
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>
