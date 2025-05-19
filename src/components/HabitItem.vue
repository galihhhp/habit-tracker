<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import type { Habit, CheckIn } from "../services/db";
import type { Achievement } from "@/services/achievements";
import { checkInService, habitService } from "../services/db";
import { checkAchievements, getTotalPoints } from "@/services/achievements";
import { aiService } from "@/services/ai";
import Button from "./ui/Button.vue";
import Calendar from "./ui/Calendar.vue";
import CompletionModal from "./modals/CompletionModal.vue";
import StreakModal from "./modals/StreakModal.vue";
import HistoryModal from "./modals/HistoryModal.vue";
import EditHabitModal from "./modals/EditHabitModal.vue";
import DropdownMenu from "./ui/DropdownMenu.vue";
import AchievementsModal from "./modals/AchievementsModal.vue";
import HabitPredictions from "./predictions/HabitPredictions.vue";

const props = defineProps<{
  habit: Habit;
  isExpanded: boolean;
}>();

const emit = defineEmits<{
  (e: "update", habit: Habit): void;
  (e: "delete", id: number): void;
  (e: "toggle-expand", id: number): void;
  (e: "edit", habit: Habit): void;
  (e: "viewHistory", habit: Habit): void;
}>();

const isEditing = ref(false);
const weekCheckIns = ref<CheckIn[]>([]);
const showCompletionModal = ref(false);
const showStreakModal = ref(false);
const currentStreak = ref(0);
const longestStreak = ref(0);
const showHistoryModal = ref(false);
const habitHistory = ref<CheckIn[]>([]);
const showAchievementsModal = ref(false);
const newAchievements = ref<Achievement[]>([]);
const predictions = ref<{
  milestones: Array<{ period: string; prediction: string }>;
  targetPrediction: string;
} | null>(null);
const isGeneratingPredictions = ref(false);

const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

const targetDaysNum = computed(() => {
  const start = new Date(props.habit.startDate);
  const end = new Date(props.habit.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
});

const frequencyNum = computed(() => targetDaysNum.value);

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

  if (isCompleted) {
    showCompletionModal.value = true;

    if (currentStreak.value > 0 && currentStreak.value % 7 === 0) {
      showStreakModal.value = true;
    }

    const totalCompletions = habitHistory.value.filter(
      (c) => c.completed
    ).length;

    const achievements = await checkAchievements(
      props.habit.id,
      currentStreak.value,
      totalCompletions
    );

    if (achievements.length > 0) {
      newAchievements.value = achievements;
      showAchievementsModal.value = true;
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

const handleEdit = () => {
  isEditing.value = true;
};

const handleViewHistory = () => {
  showHistoryModal.value = true;
};

const points = computed(() => {
  return props.habit.id ? getTotalPoints(props.habit.id) : 0;
});

const generatePredictions = async () => {
  if (!props.habit.id || isGeneratingPredictions.value) return;

  isGeneratingPredictions.value = true;
  try {
    const predictions = await aiService.getHabitPredictions(
      props.habit.name,
      props.habit.description || undefined,
      targetDaysNum.value
    );

    const habitToUpdate = {
      ...props.habit,
      predictions,
      startDate: new Date(props.habit.startDate).toISOString(),
      endDate: new Date(props.habit.endDate).toISOString(),
      createdAt: new Date(props.habit.createdAt).toISOString(),
      updatedAt: new Date().toISOString(),
      history: props.habit.history.map((h) => ({
        ...h,
        date: new Date(h.date).toISOString(),
      })),
    };

    await habitService.update(props.habit.id, habitToUpdate);

    emit("update", {
      ...props.habit,
      predictions,
      startDate: new Date(props.habit.startDate),
      endDate: new Date(props.habit.endDate),
      createdAt: new Date(props.habit.createdAt),
      updatedAt: new Date(),
      history: props.habit.history.map((h) => ({
        ...h,
        date: new Date(h.date),
      })),
    });
  } catch (error) {
    console.error("Failed to generate predictions:", error);
  } finally {
    isGeneratingPredictions.value = false;
  }
};

onMounted(() => {
  loadWeekCheckIns();
  loadHabitHistory();
});
</script>

<template>
  <div class="border rounded-lg p-4 mb-4">
    <div class="flex justify-between items-start gap-4">
      <div class="w-full">
        <h3 class="text-lg font-medium text-gray-900">{{ habit.name }}</h3>
        <p v-if="habit.description" class="text-sm text-gray-500 mt-1">
          {{ habit.description }}
        </p>
        <div
          class="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-2">
          <span>{{ new Date(habit.startDate).toLocaleDateString() }}</span>
          <span>-</span>
          <span>{{ new Date(habit.endDate).toLocaleDateString() }}</span>
          <span>•</span>
          <span>{{ targetDaysNum }} days</span>
          <span>•</span>
          <span>{{ currentStreak }} day streak</span>
          <span>•</span>
          <Button
            size="sm"
            variant="secondary"
            @click="showAchievementsModal = true"
            >🏆 {{ points }} pts
          </Button>
          <Button
            v-if="!habit.predictions"
            size="sm"
            variant="secondary"
            :loading="isGeneratingPredictions"
            :disabled="isGeneratingPredictions"
            @click="generatePredictions">
            {{
              isGeneratingPredictions
                ? "Generating Insights..."
                : "✨ Get AI Insights"
            }}
          </Button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="white"
          size="none"
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
        <DropdownMenu>
          <template #default>
            <div class="py-1">
              <button
                type="button"
                class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                @click="handleEdit">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor">
                  <path
                    d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit
              </button>
              <button
                type="button"
                class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                @click="handleViewHistory">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clip-rule="evenodd" />
                </svg>
                View History
              </button>
              <button
                type="button"
                class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                @click="handleDelete">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clip-rule="evenodd" />
                </svg>
                Delete
              </button>
            </div>
          </template>
        </DropdownMenu>
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

    <div v-if="isExpanded" class="mt-4 space-y-6">
      <Calendar
        :check-ins="weekCheckIns"
        :start-date="weekStart"
        :end-date="weekEnd"
        :show-week-days="true"
        view="week"
        :is-editable="true"
        @toggle="toggleDay" />

      <HabitPredictions
        v-if="habit.predictions"
        :predictions="habit.predictions" />
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

  <AchievementsModal
    :is-open="showAchievementsModal"
    :achievements="newAchievements"
    :habit-id="habit.id!"
    @close="showAchievementsModal = false" />
</template>
