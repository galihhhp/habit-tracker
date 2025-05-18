<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Habit } from "../services/db";
import { habitService } from "../services/db";
import HabitItem from "@/components/HabitItem.vue";
import HabitForm from "@/components/HabitForm.vue";
import Button from "./ui/Button.vue";
import Modal from "./ui/Modal.vue";

const habits = ref<Habit[]>([]);
const showForm = ref(false);
const isLoading = ref(true);

const loadHabits = async () => {
  try {
    habits.value = await habitService.getAll();
  } catch (error) {
    console.error("Failed to load habits:", error);
  } finally {
    isLoading.value = false;
  }
};

const addHabit = async (
  habit: Omit<Habit, "id" | "createdAt" | "updatedAt">
) => {
  try {
    await habitService.add(habit);
    await loadHabits();
    showForm.value = false;
  } catch (error) {
    console.error("Failed to add habit:", error);
  }
};

const updateHabit = async (habit: Habit) => {
  try {
    if (habit.id) {
      await habitService.update(habit.id, {
        name: habit.name,
        frequency: habit.frequency,
      });
      await loadHabits();
    }
  } catch (error) {
    console.error("Failed to update habit:", error);
  }
};

const deleteHabit = async (id: number) => {
  try {
    await habitService.delete(id);
    await loadHabits();
  } catch (error) {
    console.error("Failed to delete habit:", error);
  }
};

onMounted(loadHabits);
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">
          Habit Tracker
        </h1>
        <Button @click="showForm = true">Add Habit</Button>
      </div>

      <div v-if="isLoading" class="text-center py-12">
        <p class="text-gray-500">Loading habits...</p>
      </div>

      <div v-else-if="habits.length === 0" class="text-center py-12">
        <p class="text-gray-500">
          No habits yet. Add your first habit to get started!
        </p>
      </div>

      <div v-else class="space-y-4">
        <HabitItem
          v-for="habit in habits"
          :key="habit.id"
          :habit="habit"
          @update="updateHabit"
          @delete="deleteHabit" />
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
