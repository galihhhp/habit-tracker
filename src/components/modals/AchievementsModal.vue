<script setup lang="ts">
import { defineProps, defineEmits, computed } from "vue";
import type { Achievement } from "@/services/achievements";
import { getEarnedAchievements, getTotalPoints } from "@/services/achievements";
import Modal from "../ui/Modal.vue";
import Button from "../ui/Button.vue";

const props = defineProps<{
  isOpen: boolean;
  achievements: Achievement[];
  habitId: number;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const earnedAchievements = computed(() => {
  return props.habitId ? getEarnedAchievements(props.habitId) : [];
});

const totalPoints = computed(() => {
  return props.habitId ? getTotalPoints(props.habitId) : 0;
});

const badges = [
  { name: "Bronze", icon: "🥉", requirement: 100 },
  { name: "Silver", icon: "🥈", requirement: 250 },
  { name: "Gold", icon: "🥇", requirement: 500 },
  { name: "Diamond", icon: "💎", requirement: 1000 },
];

const currentBadge = computed(() => {
  return badges.reduce(
    (highest, badge) => {
      if (
        totalPoints.value >= badge.requirement &&
        badge.requirement > highest.requirement
      ) {
        return badge;
      }
      return highest;
    },
    { name: "Beginner", icon: "🌱", requirement: 0 }
  );
});

const nextBadge = computed(() => {
  return badges.find((badge) => badge.requirement > totalPoints.value);
});

const allAchievements = [
  {
    title: "Streak Achievements",
    achievements: [
      {
        id: "streak_3",
        name: "Getting Started",
        description: "Maintain a 3-day streak",
        icon: "🔥",
        points: 10,
        type: "streak",
        requirement: 3,
      },
      {
        id: "streak_7",
        name: "Week Warrior",
        description: "Maintain a 7-day streak",
        icon: "⚡",
        points: 25,
        type: "streak",
        requirement: 7,
      },
      {
        id: "streak_14",
        name: "Fortnight Fighter",
        description: "Maintain a 14-day streak",
        icon: "💪",
        points: 50,
        type: "streak",
        requirement: 14,
      },
      {
        id: "streak_30",
        name: "Monthly Master",
        description: "Maintain a 30-day streak",
        icon: "👑",
        points: 100,
        type: "streak",
        requirement: 30,
      },
      {
        id: "streak_60",
        name: "Unstoppable",
        description: "Maintain a 60-day streak",
        icon: "⭐",
        points: 200,
        type: "streak",
        requirement: 60,
      },
      {
        id: "streak_90",
        name: "Legendary",
        description: "Maintain a 90-day streak",
        icon: "🌟",
        points: 300,
        type: "streak",
        requirement: 90,
      },
    ],
  },
  {
    title: "Check-in Achievements",
    achievements: [
      {
        id: "completion_10",
        name: "Consistent",
        description: "Complete 10 habit check-ins",
        icon: "✅",
        points: 15,
        type: "completion" as const,
        requirement: 10,
      },
      {
        id: "completion_25",
        name: "Regular",
        description: "Complete 25 habit check-ins",
        icon: "📝",
        points: 30,
        type: "completion" as const,
        requirement: 25,
      },
      {
        id: "completion_50",
        name: "Dedicated",
        description: "Complete 50 habit check-ins",
        icon: "🎯",
        points: 50,
        type: "completion" as const,
        requirement: 50,
      },
      {
        id: "completion_100",
        name: "Century Club",
        description: "Complete 100 habit check-ins",
        icon: "💯",
        points: 100,
        type: "completion" as const,
        requirement: 100,
      },
    ],
  },
];
</script>

<template>
  <Modal :is-open="props.isOpen" @close="emit('close')">
    <div class="max-h-[80vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-medium text-gray-900">Achievements</h2>
        <div class="flex items-center gap-2">
          <span class="text-2xl">{{ currentBadge.icon }}</span>
          <div>
            <p class="font-medium text-gray-900">{{ currentBadge.name }}</p>
            <p class="text-sm text-gray-500">{{ totalPoints }} points</p>
          </div>
        </div>
      </div>

      <div v-if="nextBadge" class="mb-6 bg-gray-50 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <span class="text-2xl">{{ nextBadge.icon }}</span>
          <div class="flex-1">
            <p class="font-medium text-gray-900">
              Next Badge: {{ nextBadge.name }}
            </p>
            <div class="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-gray-800 transition-all duration-300"
                :style="{
                  width: `${(totalPoints / nextBadge.requirement) * 100}%`,
                }"></div>
            </div>
            <p class="text-sm text-gray-500 mt-1">
              {{ totalPoints }}/{{ nextBadge.requirement }} points
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div v-for="section in allAchievements" :key="section.title">
          <h3 class="text-lg font-medium text-gray-900 mb-3">
            {{ section.title }}
          </h3>
          <div class="grid gap-3">
            <div
              v-for="achievement in section.achievements"
              :key="achievement.id"
              class="flex items-center gap-3 p-4 rounded-lg"
              :class="
                earnedAchievements.some((a) => a.id === achievement.id)
                  ? 'bg-gray-50'
                  : 'bg-gray-100/50'
              ">
              <div
                class="text-2xl"
                :class="
                  earnedAchievements.some((a) => a.id === achievement.id)
                    ? ''
                    : 'opacity-50'
                ">
                {{ achievement.icon }}
              </div>
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">
                  {{ achievement.name }}
                </h4>
                <p class="text-sm text-gray-500">
                  {{ achievement.description }}
                </p>
                <p class="text-sm font-medium text-gray-700 mt-1">
                  +{{ achievement.points }} points
                </p>
              </div>
              <div
                v-if="earnedAchievements.some((a) => a.id === achievement.id)"
                class="text-green-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  viewBox="0 0 20 20"
                  fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd" />
                </svg>
              </div>
              <div v-else class="text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  viewBox="0 0 20 20"
                  fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <Button variant="primary" @click="emit('close')">Close</Button>
      </div>
    </div>
  </Modal>
</template>
