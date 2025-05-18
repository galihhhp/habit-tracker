<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import type { Habit, CheckIn } from "../services/db";
import { checkInService } from "../services/db";
import Input from "./ui/Input.vue";
import Select from "./ui/Select.vue";
import IconButton from "./ui/IconButton.vue";
import Modal from "./ui/Modal.vue";

const props = defineProps<{
  habit: Habit;
  isExpanded: boolean;
}>();

const emit = defineEmits(["update", "delete", "toggleExpand"]);

const isEditing = ref(false);
const editedName = ref(props.habit.name);
const editedFrequency = ref(props.habit.frequency);
const streak = ref(0);
const weekCheckIns = ref<CheckIn[]>([]);
const showCompletionModal = ref(false);

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
};

const toggleDay = async (day: {
  date: Date;
  isToday: boolean;
  isCompleted: boolean;
}) => {
  if (!props.habit.id) return;

  const date = new Date(day.date);
  date.setHours(0, 0, 0, 0);

  await checkInService.toggle(props.habit.id, date);
  await loadWeekCheckIns();

  if (!day.isCompleted) {
    showCompletionModal.value = true;
  }
};

const save = () => {
  if (!editedName.value.trim()) {
    alert("Please enter a habit name");
    return;
  }

  emit("update", {
    ...props.habit,
    name: editedName.value.trim(),
    frequency: editedFrequency.value,
  });

  isEditing.value = false;
};

const cancel = () => {
  editedName.value = props.habit.name;
  editedFrequency.value = props.habit.frequency;
  isEditing.value = false;
};

onMounted(loadWeekCheckIns);
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200">
    <div v-if="!isEditing" class="p-4">
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3">
            <button
              @click="emit('toggleExpand')"
              class="flex-shrink-0 w-5 h-5 rounded border border-gray-300 hover:border-gray-400 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5 text-gray-600"
                :class="{ 'transform rotate-180': isExpanded }"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clip-rule="evenodd" />
              </svg>
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
            <p class="text-sm text-gray-500">Streak: {{ streak }} days</p>
          </div>
        </div>
        <div class="flex items-center space-x-2 ml-4">
          <IconButton
            variant="secondary"
            size="sm"
            title="Edit habit"
            @click="isEditing = true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor">
              <path
                d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </IconButton>
          <IconButton
            variant="danger"
            size="sm"
            title="Delete habit"
            @click="emit('delete', habit.id)">
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
          </IconButton>
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

      <div v-if="isExpanded" class="mt-4 grid grid-cols-7 gap-1">
        <button
          v-for="day in weekDays"
          :key="day.date.toISOString()"
          @click="toggleDay(day)"
          class="h-12 flex items-center justify-center rounded-lg border transition-colors"
          :class="[
            day.isToday ? 'border-gray-800' : 'border-gray-200',
            day.isCompleted
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50',
          ]">
          <span class="text-xs font-medium">
            {{ day.date.toLocaleDateString("en-US", { weekday: "short" }) }}
          </span>
        </button>
      </div>
    </div>

    <div v-else class="p-4 space-y-4">
      <Input
        v-model="editedName"
        label="Habit Name"
        placeholder="Enter habit name"
        required />

      <Select
        v-model="editedFrequency"
        :options="frequencyOptions"
        label="Weekly Target" />

      <div class="flex space-x-2">
        <IconButton
          variant="primary"
          size="sm"
          title="Save changes"
          @click="save">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd" />
          </svg>
        </IconButton>
        <IconButton
          variant="secondary"
          size="sm"
          title="Cancel"
          @click="cancel">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd" />
          </svg>
        </IconButton>
      </div>
    </div>

    <Modal
      :is-open="showCompletionModal"
      title="Great job! 🎉"
      @close="showCompletionModal = false">
      <div class="space-y-4">
        <p class="text-gray-600">
          You've completed your habit for today. Keep up the good work!
        </p>
        <div class="flex justify-end">
          <IconButton
            variant="primary"
            size="sm"
            title="Close"
            @click="showCompletionModal = false">
            Close
          </IconButton>
        </div>
      </div>
    </Modal>
  </div>
</template>
