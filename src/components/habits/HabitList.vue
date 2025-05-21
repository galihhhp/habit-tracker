<script setup lang="ts">
import { ref } from "vue";
import type { Habit } from "@/services/db";
import HabitItem from "@/components/habits/HabitItem.vue";

const props = defineProps<{
  habits: Habit[];
}>();

const emit = defineEmits<{
  (e: "update", habit: Habit): void;
  (e: "delete", id: number): void;
}>();
</script>

<template>
  <div class="space-y-4">
    <div v-if="props.habits.length === 0" class="text-center py-12">
      <p class="text-gray-500">
        No habits found. Add your first habit to get started!
      </p>
    </div>
    <div v-else class="space-y-4">
      <HabitItem
        v-for="habit in props.habits"
        :key="habit.id"
        :habit="habit"
        @update="emit('update', $event)"
        @delete="emit('delete', $event)" />
    </div>
  </div>
</template>
