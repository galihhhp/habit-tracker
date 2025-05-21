<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import type { Habit, CheckIn } from "../services/db";
import type { Achievement } from "@/services/achievements";
import { checkInService, habitService } from "../services/db";
import {
  checkAchievements,
  getTotalPoints,
  removeInvalidAchievements,
} from "@/services/achievements";
import { aiService } from "@/services/ai";
import Button from "./ui/Button.vue";
import Calendar from "./ui/Calendar.vue";
import HabitCalendar from "./ui/HabitCalendar.vue";
import CompletionModal from "./modals/CompletionModal.vue";
import StreakModal from "./modals/StreakModal.vue";
import HistoryModal from "./modals/HistoryModal.vue";
import EditHabitModal from "./modals/EditHabitModal.vue";
import DropdownMenu from "./ui/DropdownMenu.vue";
import AchievementsModal from "./modals/AchievementsModal.vue";
import HabitPredictions from "./predictions/HabitPredictions.vue";

const props = defineProps<{
  habit: Habit;
}>();

const emit = defineEmits(["update", "delete"]);

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
const totalPoints = ref(0);

const targetDaysNum = computed(() => {
  const start = new Date(props.habit.startDate);
  const end = new Date(props.habit.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
});

const frequencyNum = computed(() => {
  return props.habit.frequency?.times ? Number(props.habit.frequency.times) : 1;
});

const weekProgress = computed(() => {
  const completed = weekCheckIns.value.filter((c) => c.completed).length;
  const total = frequencyNum.value;
  const percentage = total > 0 ? Math.min(100, (completed / total) * 100) : 0;
  return { completed, total, percentage };
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
        tempCount = tempCount > 0 ? tempCount + 1 : 1;
        if (checkInDate.getTime() === today.getTime()) {
          currentCount = tempCount;
        }
      } else {
        tempCount = 1;
      }

      if (checkInDate.getTime() === today.getTime()) {
        currentCount = Math.max(currentCount, 1);
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

  const checkInBeforeToggle = weekCheckIns.value.find((c) => {
    const checkInDate = new Date(c.date);
    checkInDate.setHours(0, 0, 0, 0);
    return checkInDate.getTime() === date.getTime();
  });

  const wasCompletedBefore = checkInBeforeToggle?.completed || false;

  await checkInService.toggle(props.habit.id, date);
  await loadWeekCheckIns();
  await loadHabitHistory();

  const isCompletedAfter = weekCheckIns.value.find((c) => {
    const checkInDate = new Date(c.date);
    checkInDate.setHours(0, 0, 0, 0);
    return checkInDate.getTime() === date.getTime();
  })?.completed;

  if (isCompletedAfter) {
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
  } else if (wasCompletedBefore) {
    await calculateStreak();

    const totalCompletions = habitHistory.value.filter(
      (c) => c.completed
    ).length;

    await removeInvalidAchievements(
      props.habit.id,
      currentStreak.value,
      totalCompletions
    );
  }

  await loadPoints();
};

const loadPoints = async () => {
  if (props.habit.id) {
    totalPoints.value = await getTotalPoints(props.habit.id);
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

const handleDelete = () => {
  if (props.habit.id) {
    emit("delete", props.habit.id);
  }
};

const handleEdit = () => {
  isEditing.value = true;
};

const handleViewHistory = () => {
  showHistoryModal.value = true;
};

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
    console.log(error);
  } finally {
    isGeneratingPredictions.value = false;
  }
};

onMounted(async () => {
  if (!props.habit.frequency) {
    const updatedHabit = {
      ...props.habit,
      frequency: {
        times: 1,
        period: "week",
      },
    };
    emit("update", updatedHabit);
  }
  await loadWeekCheckIns();
  await loadHabitHistory();
  await loadPoints();
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
          <span>{{ habit.frequency?.times || 1 }} times per week</span>
          <span>•</span>
          <span>{{ currentStreak }} day streak</span>
          <span>•</span>
          <Button
            size="sm"
            variant="secondary"
            @click="showAchievementsModal = true"
            >🏆 {{ totalPoints }} pts
          </Button>
          <Button
            v-if="!habit.predictions"
            size="sm"
            variant="secondary"
            :loading="isGeneratingPredictions"
            :disabled="isGeneratingPredictions"
            title="Generate insights about your habit success patterns and milestones predictions"
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

    <div class="mt-4">
      <HabitCalendar
        :check-ins="habitHistory"
        :is-editable="true"
        :habit-id="habit.id"
        @toggle="toggleDay" />

      <div v-if="habit.predictions" class="mt-4">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-sm font-medium text-gray-700">AI Insights</h3>
        </div>
        <HabitPredictions :predictions="habit.predictions" />
      </div>
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
