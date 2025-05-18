<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import type { Habit, CheckIn } from "../services/db";
import { checkInService } from "../services/db";
import Button from "./ui/Button.vue";
import Calendar from "./ui/Calendar.vue";
import CompletionModal from "./modals/CompletionModal.vue";
import StreakModal from "./modals/StreakModal.vue";
import HistoryModal from "./modals/HistoryModal.vue";
import EditHabitModal from "./modals/EditHabitModal.vue";

const props = defineProps<{
  habit: Habit;
  isExpanded: boolean;
}>();

const emit = defineEmits(["update", "delete", "toggleExpand"]);

const isEditing = ref(false);
const weekCheckIns = ref<CheckIn[]>([]);
const showCompletionModal = ref(false);
const showStreakModal = ref(false);
const currentStreak = ref(0);
const longestStreak = ref(0);
const showHistoryModal = ref(false);
const habitHistory = ref<CheckIn[]>([]);

const frequencyOptions = [
  { value: 1, label: "1 day per week" },
  { value: 2, label: "2 days per week" },
  { value: 3, label: "3 days per week" },
  { value: 4, label: "4 days per week" },
  { value: 5, label: "5 days per week" },
  { value: 6, label: "6 days per week" },
  { value: 7, label: "Daily" },
];

const weekProgress = computed(() => {
  const completed = weekCheckIns.value.filter((c) => c.completed).length;
  return {
    completed,
    total: props.habit.frequency,
    percentage: Math.min(100, (completed / props.habit.frequency) * 100),
  };
});

const weekDays = computed(() => {
  const today = new Date();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const checkIn = weekCheckIns.value.find((c) => {
      const checkInDate = new Date(c.date);
      checkInDate.setHours(0, 0, 0, 0);
      return checkInDate.getTime() === date.getTime();
    });

    days.push({
      date,
      isToday: i === 0,
      isCompleted: checkIn?.completed || false,
    });
  }

  return days;
});

const weekStart = computed(() => {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return start;
});

const weekEnd = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
});

const calculateStreak = async () => {
  if (!props.habit.id) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allCheckIns = await checkInService.getForHabit(
    props.habit.id,
    new Date(0),
    today
  );

  const sortedCheckIns = allCheckIns.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let currentCount = 0;
  let longestCount = 0;
  let tempCount = 0;
  let lastDate: Date | null = null;

  for (const checkIn of sortedCheckIns) {
    const checkInDate = new Date(checkIn.date);
    checkInDate.setHours(0, 0, 0, 0);

    if (checkIn.completed) {
      if (!lastDate || isConsecutiveDay(lastDate, checkInDate)) {
        tempCount++;
        if (checkInDate.getTime() === today.getTime()) {
          currentCount = tempCount;
        }
      } else {
        tempCount = 1;
      }
      longestCount = Math.max(longestCount, tempCount);
    } else {
      tempCount = 0;
    }
    lastDate = checkInDate;
  }

  currentStreak.value = currentCount;
  longestStreak.value = longestCount;
};

const isConsecutiveDay = (date1: Date, date2: Date): boolean => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

const loadWeekCheckIns = async () => {
  if (!props.habit.id) return;

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  weekCheckIns.value = await checkInService.getForHabit(
    props.habit.id,
    weekStart,
    today
  );
  await calculateStreak();
};

const toggleDay = async (date: Date) => {
  if (!props.habit.id) return;

  date.setHours(0, 0, 0, 0);

  await checkInService.toggle(props.habit.id, date);
  await loadWeekCheckIns();

  const isCompleted = weekCheckIns.value.find((c) => {
    const checkInDate = new Date(c.date);
    checkInDate.setHours(0, 0, 0, 0);
    return checkInDate.getTime() === date.getTime();
  })?.completed;

  if (!isCompleted) {
    showCompletionModal.value = true;

    if (currentStreak.value > 0 && currentStreak.value % 7 === 0) {
      showStreakModal.value = true;
    }
  }
};

const save = (updatedHabit: Habit) => {
  emit("update", updatedHabit);
  isEditing.value = false;
};

const loadHabitHistory = async () => {
  if (!props.habit.id) return;

  const today = new Date();
  const startDate = new Date();
  startDate.setMonth(today.getMonth() - 1);

  habitHistory.value = await checkInService.getForHabit(
    props.habit.id,
    startDate,
    today
  );
};

const analytics = computed(() => {
  const weeklyCompletions = weekCheckIns.value.filter(
    (c) => c.completed
  ).length;
  const weeklyAdherence = Math.min(
    100,
    (weeklyCompletions / props.habit.frequency) * 100
  );

  const totalCompletions = habitHistory.value.filter((c) => c.completed).length;
  const totalDays = habitHistory.value.length;
  const allTimeAdherence =
    totalDays > 0 ? Math.min(100, (totalCompletions / totalDays) * 100) : 0;

  return {
    weekly: {
      completions: weeklyCompletions,
      adherence: Math.round(weeklyAdherence),
      target: props.habit.frequency,
    },
    allTime: {
      completions: totalCompletions,
      adherence: Math.round(allTimeAdherence),
      longestStreak: longestStreak.value,
    },
  };
});

onMounted(() => {
  loadWeekCheckIns();
  loadHabitHistory();
});
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200">
    <div class="p-4">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3">
            <button
              @click="emit('toggleExpand')"
              class="flex-shrink-0 w-5 h-5 cursor-pointer">
              <img
                src="@/assets/icons/chevron-down.svg"
                class="w-5 h-5 text-gray-600 transition-transform duration-200"
                :class="{ 'transform rotate-180': isExpanded }"
                alt="Toggle expand" />
            </button>
            <h3 class="text-lg font-medium text-gray-900 truncate">
              {{ habit.name }}
            </h3>
          </div>
          <div class="mt-1 flex items-center space-x-4">
            <p class="text-sm text-gray-500">
              {{
                frequencyOptions.find((opt) => opt.value === habit.frequency)
                  ?.label
              }}
            </p>
            <button
              @click="showStreakModal = true"
              class="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <span class="font-medium text-gray-900">{{ currentStreak }}</span>
              day streak
            </button>
          </div>
        </div>
        <div class="flex items-center space-x-2 ml-4">
          <Button
            variant="secondary"
            size="sm"
            title="Edit habit"
            @click="isEditing = true">
            <img src="@/assets/icons/edit.svg" class="h-4 w-4" alt="Edit" />
          </Button>
          <Button
            variant="danger"
            size="sm"
            title="Delete habit"
            @click="emit('delete', habit.id)">
            <img src="@/assets/icons/trash.svg" class="h-4 w-4" alt="Delete" />
          </Button>
        </div>
      </div>

      <div class="mt-4 space-y-1">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Weekly Progress</span>
          <span class="text-gray-900 font-medium"
            >{{ weekProgress.completed }}/{{ weekProgress.total }}</span
          >
        </div>
        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gray-800 transition-all duration-300"
            :style="{ width: `${weekProgress.percentage}%` }"></div>
        </div>
      </div>

      <div v-if="isExpanded" class="mt-4">
        <Calendar
          :check-ins="weekCheckIns"
          :start-date="weekStart"
          :end-date="weekEnd"
          :show-week-days="true"
          view="week"
          :is-editable="true"
          @toggle="toggleDay" />
      </div>
    </div>

    <CompletionModal
      :is-open="showCompletionModal"
      @close="showCompletionModal = false" />

    <StreakModal
      :is-open="showStreakModal"
      :current-streak="currentStreak"
      :longest-streak="longestStreak"
      @close="showStreakModal = false" />

    <div class="mt-4 flex justify-end">
      <Button
        variant="secondary"
        size="sm"
        title="View History"
        @click="showHistoryModal = true">
        View History
      </Button>
    </div>

    <HistoryModal
      :is-open="showHistoryModal"
      :habit-history="habitHistory"
      :analytics="analytics"
      @close="showHistoryModal = false" />

    <EditHabitModal
      :is-open="isEditing"
      :habit="habit"
      @close="isEditing = false"
      @save="save" />
  </div>
</template>
