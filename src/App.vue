<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { Habit, CheckIn } from "./services/db";
import { habitService, checkInService } from "./services/db";
import AddHabitModal from "@/components/modals/AddHabitModal.vue";
import EditHabitModal from "@/components/modals/EditHabitModal.vue";
import Button from "./components/ui/Button.vue";
import HabitList from "./components/HabitList.vue";
import Pagination from "./components/ui/Pagination.vue";
import Select from "./components/ui/Select.vue";
import Input from "./components/ui/Input.vue";
import { useSearchParams } from "./composables/useSearchParams";
import DeleteConfirmationModal from "./components/modals/DeleteConfirmationModal.vue";
import HabitItem from "./components/HabitItem.vue";
import HistoryModal from "./components/modals/HistoryModal.vue";

const habits = ref<Habit[]>([]);
const showAddModal = ref(false);
const showEditModal = ref(false);
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

const handleSaveHabit = async (
  habit: Omit<Habit, "id" | "createdAt" | "updatedAt">
) => {
  await habitService.add(habit);
  await loadHabits();
  showAddModal.value = false;
};

const handleEditHabit = (habit: Habit) => {
  editingHabit.value = habit;
  showEditModal.value = true;
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

const handleSaveEdit = async (habit: Habit) => {
  await habitService.update(habit.id!, habit);
  await loadHabits();
  showEditModal.value = false;
  editingHabit.value = null;
};

const handleCloseAddModal = () => {
  showAddModal.value = false;
};

const handleCloseEditModal = () => {
  showEditModal.value = false;
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
    case "streak":
      result.sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0));
      break;
    case "completion":
      result.sort((a, b) => (b.completionRate || 0) - (a.completionRate || 0));
      break;
    case "created":
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
        <Button variant="primary" @click="showAddModal = true">
          Add Habit
        </Button>
      </div>

      <div class="bg-white rounded-lg border md:mx-40">
        <div class="p-6">
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
                  { value: 'streak', label: 'Sort by Current Streak' },
                  { value: 'completion', label: 'Sort by Completion Rate' },
                  { value: 'created', label: 'Sort by Recently Added' },
                ]" />
            </div>
          </div>

          <HabitList
            :habits="paginatedHabits"
            @update="handleEditHabit"
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

    <AddHabitModal
      :is-open="showAddModal"
      @close="handleCloseAddModal"
      @save="handleSaveHabit" />

    <EditHabitModal
      v-if="editingHabit"
      :is-open="showEditModal"
      :habit="editingHabit"
      @close="handleCloseEditModal"
      @save="handleSaveEdit" />

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
          target: editingHabit.targetDays,
        },
        allTime: {
          completions: habitHistory.filter((h) => h.completed).length,
          adherence:
            Math.round(
              (habitHistory.filter((h) => h.completed).length /
                habitHistory.length) *
                100
            ) || 0,
          longestStreak: editingHabit.longestStreak,
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
