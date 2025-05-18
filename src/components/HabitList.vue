<script setup lang="ts">
import { ref } from "vue";
import type { Habit } from "../services/db";
import { habitService } from "../services/db";
import HabitItem from "@/components/HabitItem.vue";
import HabitForm from "@/components/HabitForm.vue";
import Modal from "./ui/Modal.vue";
import Button from "./ui/Button.vue";

const habits = ref<Habit[]>([]);
const expandedHabitId = ref<number | null>(null);
const showForm = ref(false);

const loadHabits = async () => {
  habits.value = await habitService.getAll();
};

const addHabit = async (
  habit: Omit<Habit, "id" | "createdAt" | "updatedAt">
) => {
  await habitService.add(habit);
  await loadHabits();
  showForm.value = false;
};

const updateHabit = async (habit: Habit) => {
  if (!habit.id) return;
  await habitService.update(habit.id, habit);
  await loadHabits();
};

const deleteHabit = async (id: number) => {
  if (!confirm("Are you sure you want to delete this habit?")) return;
  await habitService.delete(id);
  await loadHabits();
};

const toggleExpand = (habitId: number) => {
  expandedHabitId.value = expandedHabitId.value === habitId ? null : habitId;
};

loadHabits();
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">My Habits</h2>
        <Button
          variant="primary"
          size="sm"
          title="Add new habit"
          @click="showForm = true">
          Add Habit
        </Button>
      </div>

      <div v-if="habits.length === 0" class="text-center py-12">
        <p class="text-gray-500">
          No habits yet. Add your first habit to get started!
        </p>
      </div>

      <div v-else class="space-y-4">
        <HabitItem
          v-for="habit in habits"
          :key="habit.id"
          :habit="habit"
          :is-expanded="expandedHabitId === habit.id"
          @update="updateHabit"
          @delete="deleteHabit"
          @toggle-expand="toggleExpand(habit.id!)" />
      </div>

      <Modal
        :is-open="showForm"
        title="Add New Habit"
        @close="showForm = false">
        <HabitForm @submit="addHabit" />
      </Modal>
    </div>
  </div>
</template>
