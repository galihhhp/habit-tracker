<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { Habit, CheckIn } from "./services/db";
import { habitService, checkInService } from "./services/db";
import HabitFormModal from "@/components/forms/HabitFormModal.vue";
import Button from "./components/ui/Button.vue";
import HabitList from "./components/habits/HabitList.vue";
import Pagination from "./components/layout/Pagination.vue";
import Select from "./components/ui/Select.vue";
import Input from "./components/ui/Input.vue";
import { useSearchParams } from "./composables/useSearchParams";
import DeleteConfirmationModal from "./components/modals/DeleteConfirmationModal.vue";
import HabitItem from "./components/habits/HabitItem.vue";
import HistoryModal from "./components/modals/HistoryModal.vue";

const habits = ref<Habit[]>([]);
const showHabitModal = ref(false);
const habitModalMode = ref<"add" | "edit">("add");
const editingHabit = ref<Habit | null>(null);
const { searchQuery, sortBy, filterBy, page, itemsPerPage } = useSearchParams();
const showDeleteModal = ref(false);
const deletingHabitId = ref<number | null>(null);
const showHistoryModal = ref(false);
const habitHistory = ref<CheckIn[]>([]);

const loadHabits = async () => {
  try {
    const loadedHabits = await habitService.getAll();
    habits.value = loadedHabits.map((habit) => ({
      ...habit,
      createdAt: new Date(habit.createdAt),
      updatedAt: new Date(habit.updatedAt),
      history: habit.history.map((h: { date: string | number | Date }) => ({
        ...h,
        date: new Date(h.date),
      })),
    }));
  } catch (error) {
    console.log(error);
  }
};

const handleAddHabit = () => {
  habitModalMode.value = "add";
  editingHabit.value = null;
  showHabitModal.value = true;
};

const handleSaveHabit = async (
  habit: Omit<Habit, "id" | "createdAt" | "updatedAt"> | Habit
) => {
  if (habitModalMode.value === "add") {
    const serializedHabit = {
      ...(habit as Omit<Habit, "id" | "createdAt" | "updatedAt">),
      startDate:
        habit.startDate instanceof Date
          ? habit.startDate
          : new Date(habit.startDate),
      endDate:
        habit.endDate instanceof Date ? habit.endDate : new Date(habit.endDate),
      frequency: {
        ...habit.frequency,
        period: "week" as const,
      },
    };
    await habitService.add(serializedHabit);
  } else if (habitModalMode.value === "edit" && "id" in habit) {
    const serializedHabit = {
      ...habit,
      frequency: {
        ...habit.frequency,
        period: "week" as const,
      },
    };
    await habitService.update(habit.id!, serializedHabit);
  }

  await loadHabits();
  showHabitModal.value = false;
  editingHabit.value = null;
};

const handleEditHabit = (habit: Habit) => {
  editingHabit.value = habit;
  habitModalMode.value = "edit";
  showHabitModal.value = true;
};

const handleUpdateHabit = async (habit: Habit) => {
  if (!habit.id) return;

  const serializedHabit = {
    ...habit,
    frequency: {
      ...habit.frequency,
      period: "week" as const,
    },
  };

  await habitService.update(habit.id, serializedHabit);
  await loadHabits();
};

const handleViewHistory = async (habit: Habit) => {
  if (!habit.id) return;

  editingHabit.value = habit;
  const today = new Date();
  const startDate = new Date();
  startDate.setMonth(today.getMonth() - 1);

  habitHistory.value = await checkInService.getForHabit(
    habit.id,
    startDate,
    today
  );
  showHistoryModal.value = true;
};

const handleCloseHabitModal = () => {
  showHabitModal.value = false;
  editingHabit.value = null;
};

const handleDeleteHabit = (id: number) => {
  deletingHabitId.value = id;
  showDeleteModal.value = true;
};

const handleConfirmDelete = async () => {
  if (!deletingHabitId.value) return;
  try {
    await habitService.delete(deletingHabitId.value);
    await loadHabits();
    showDeleteModal.value = false;
    deletingHabitId.value = null;
  } catch (error) {
    console.log(error);
  }
};

const handleCloseDeleteModal = () => {
  showDeleteModal.value = false;
  deletingHabitId.value = null;
};

const handleCloseHistoryModal = () => {
  showHistoryModal.value = false;
  editingHabit.value = null;
  habitHistory.value = [];
};

const filteredHabits = computed(() => {
  let result = [...habits.value];

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    result = result.filter(
      (habit) =>
        habit.name.toLowerCase().includes(query) ||
        (habit.description?.toLowerCase() || "").includes(query)
    );
  }

  switch (sortBy.value) {
    case "name":
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "completion":
      result.sort((a, b) => (b.completionRate || 0) - (a.completionRate || 0));
      break;
    case "created":
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
  }

  return result;
});

const paginatedHabits = computed(() => {
  const start = (page.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredHabits.value.slice(start, end);
});

const totalPages = computed(() =>
  Math.ceil(filteredHabits.value.length / itemsPerPage)
);

onMounted(loadHabits);
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Habit Tracker</h1>
        <Button variant="primary" @click="handleAddHabit"> Add Habit </Button>
      </div>

      <div class="bg-white rounded-lg border md:mx-40">
        <div class="p-6">
          <div class="mb-6">
            <h4 class="text-md font-semibold text-gray-700 mb-2">Tips:</h4>
            <ul class="text-sm text-gray-600 list-disc pl-4 space-y-1">
              <li class="pr-1">Check-in daily to build consistency.</li>
              <li class="pr-1">Build streaks to earn achievements.</li>
              <li class="pr-1">
                Complete at least your chosen frequency, but daily check-ins are
                recommended.
              </li>
            </ul>
          </div>
          <div class="flex flex-col sm:flex-row gap-4 mb-6 items-center">
            <div class="flex-1 w-full md:w-auto">
              <Input
                v-model="searchQuery"
                placeholder="Search habits..."
                type="search" />
            </div>
            <div class="flex gap-4 w-full md:w-auto">
              <Select
                v-model="sortBy"
                :options="[
                  { value: 'name', label: 'Sort by Name' },
                  { value: 'completion', label: 'Sort by Completion Rate' },
                  { value: 'created', label: 'Sort by Recently Added' },
                ]" />
            </div>
          </div>

          <HabitList
            :habits="paginatedHabits"
            @update="handleUpdateHabit"
            @delete="handleDeleteHabit"
            @edit="handleEditHabit"
            @view-history="handleViewHistory" />

          <div class="mt-6">
            <Pagination
              :current-page="page"
              :total-pages="totalPages"
              :total-items="filteredHabits.length"
              :items-per-page="itemsPerPage"
              @page-change="page = $event" />
          </div>
        </div>
      </div>
    </div>

    <HabitFormModal
      :is-open="showHabitModal"
      :mode="habitModalMode"
      :habit="editingHabit"
      @close="handleCloseHabitModal"
      @save="handleSaveHabit" />

    <DeleteConfirmationModal
      :is-open="showDeleteModal"
      :habit-name="habits.find((h) => h.id === deletingHabitId)?.name || ''"
      @close="handleCloseDeleteModal"
      @confirm="handleConfirmDelete" />

    <HistoryModal
      v-if="editingHabit"
      :is-open="showHistoryModal"
      :habit-history="habitHistory"
      :analytics="{
        weekly: {
          completions: habitHistory.filter((h) => h.completed).length,
          adherence:
            Math.round(
              (habitHistory.filter((h) => h.completed).length /
                habitHistory.length) *
                100
            ) || 0,
          target:
            Math.ceil(
              Math.abs(
                new Date(editingHabit.endDate).getTime() -
                  new Date(editingHabit.startDate).getTime()
              ) /
                (1000 * 60 * 60 * 24)
            ) + 1,
        },
        allTime: {
          completions: habitHistory.filter((h) => h.completed).length,
          adherence:
            Math.round(
              (habitHistory.filter((h) => h.completed).length /
                habitHistory.length) *
                100
            ) || 0,
          longestStreak: 0,
        },
      }"
      @close="handleCloseHistoryModal" />
  </div>
</template>

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #374151;
  line-height: 1.5;
}
</style>
