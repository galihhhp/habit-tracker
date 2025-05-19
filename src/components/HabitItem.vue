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

const emit = defineEmits<{
  (e: "update", habit: Habit): void;
  (e: "delete", id: number): void;
  (e: "toggle-expand", id: number): void;
}>();

const isEditing = ref(false);
const weekCheckIns = ref<CheckIn[]>([]);
const showCompletionModal = ref(false);
const showStreakModal = ref(false);
const currentStreak = ref(0);
const longestStreak = ref(0);
const showHistoryModal = ref(false);
const habitHistory = ref<CheckIn[]>([]);

const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

const targetDaysNum = computed(() => Number(props.habit.targetDays) || 0);
const frequencyNum = computed(() => {
  const freq = props.habit.frequency;
  if (freq === "daily") {
    return 7;
  }
  if (freq === "weekly") {
    return Number(props.habit.targetDays) || 0;
  }
  return 0;
});

const weekProgress = computed(() => {
  const completed = weekCheckIns.value.filter((c) => c.completed).length;
  const total = frequencyNum.value;
  const percentage = total > 0 ? Math.min(100, (completed / total) * 100) : 0;
  return { completed, total, percentage };
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
  const weeklyAdherence =
    frequencyNum.value > 0
      ? Math.min(100, (weeklyCompletions / frequencyNum.value) * 100)
      : 0;

  const totalCompletions = habitHistory.value.filter((c) => c.completed).length;
  const totalDays = habitHistory.value.length;
  const allTimeAdherence =
    totalDays > 0 ? Math.min(100, (totalCompletions / totalDays) * 100) : 0;

  return {
    weekly: {
      completions: weeklyCompletions,
      adherence: Math.round(weeklyAdherence),
      target: frequencyNum.value,
    },
    allTime: {
      completions: totalCompletions,
      adherence: Math.round(allTimeAdherence),
      longestStreak: longestStreak.value,
    },
  };
});

const handleToggleActive = () => {
  emit("update", {
    ...props.habit,
    isActive: !props.habit.isActive,
  });
};

const handleDelete = () => {
  if (props.habit.id) {
    emit("delete", props.habit.id);
  }
};

const handleToggleExpand = () => {
  if (props.habit.id) {
    emit("toggle-expand", props.habit.id);
  }
};

onMounted(() => {
  loadWeekCheckIns();
  loadHabitHistory();
});
</script>

<template>
  <div class="border rounded-lg p-4 mb-4">
    <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
      <div class="w-full">
        <h3 class="text-lg font-medium text-gray-900">{{ habit.name }}</h3>
        <p v-if="habit.description" class="text-sm text-gray-500 mt-1">
          {{ habit.description }}
        </p>
        <div
          class="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-2">
          <span class="capitalize">{{ habit.frequency }}</span>
          <span>•</span>
          <span
            >{{ habit.targetDays }}
            {{
              habit.frequency === "daily"
                ? "days"
                : habit.frequency === "weekly"
                ? "weeks"
                : "months"
            }}</span
          >
          <span>•</span>
          <span>{{ currentStreak }} day streak</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="secondary"
          class="p-2"
          :title="isExpanded ? 'Show Less' : 'Show More'"
          @click="handleToggleExpand">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 transition-transform duration-200"
            :class="{ 'rotate-180': isExpanded }"
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd" />
          </svg>
        </Button>
        <Button
          variant="secondary"
          class="p-2"
          title="Edit Habit"
          @click="isEditing = true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </Button>
        <Button
          variant="danger"
          class="p-2"
          title="Delete Habit"
          @click="handleDelete">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clip-rule="evenodd" />
          </svg>
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
</template>
