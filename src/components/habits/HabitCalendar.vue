<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { Calendar } from "v-calendar";
import "v-calendar/dist/style.css";
import type { CheckIn } from "@/services/db";

const props = defineProps<{
  checkIns: CheckIn[];
  isEditable: boolean;
  habitId?: number;
}>();

const emit = defineEmits<{
  (e: "toggle", date: Date): void;
}>();

const lastClickedDate = ref<string | null>(null);
const isProcessing = ref(false);

const attributes = computed(() => {
  const checkInAttributes = props.checkIns.map((checkIn) => {
    const date = new Date(checkIn.date);
    const dateString = date.toISOString().split("T")[0];

    return {
      key: `checkIn-${dateString}`,
      dates: date,
      dot: {
        color: checkIn.completed ? "green" : "gray",
        class: checkIn.completed ? "bg-green-500" : "bg-gray-300",
      },
      customData: {
        checkIn,
        dateString,
      },
    };
  });

  if (lastClickedDate.value && isProcessing.value) {
    checkInAttributes.push({
      key: "processing",
      dates: new Date(lastClickedDate.value),
      dot: { color: "blue", class: "bg-blue-500" },
      customData: {
        checkIn: {} as CheckIn,
        dateString: lastClickedDate.value,
      },
    });
  }

  return checkInAttributes as any;
});

const handleDayClick = (day: any) => {
  if (!props.isEditable || isProcessing.value) return;

  const clickedDate = new Date(day.id);
  const dateString = clickedDate.toISOString().split("T")[0];

  lastClickedDate.value = dateString;
  isProcessing.value = true;

  emit("toggle", clickedDate);

  setTimeout(() => {
    isProcessing.value = false;
    lastClickedDate.value = null;
  }, 500);
};

const today = new Date();
today.setHours(0, 0, 0, 0);

const defaultFrom = new Date(today);
defaultFrom.setDate(today.getDate() - 15);

const defaultTo = new Date(today);
defaultTo.setDate(today.getDate() + 15);

const isToday = (date: Date): boolean => {
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const handleTodayCheckIn = () => {
  if (!props.isEditable) return;

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  emit("toggle", todayDate);
};

const todayCheckInStatus = computed(() => {
  if (!props.isEditable) return "";

  const todayCheckIn = props.checkIns.find((checkIn) => {
    const checkInDate = new Date(checkIn.date);
    return isToday(checkInDate);
  });

  return todayCheckIn?.completed ? "Completed" : "Not Completed";
});

const todayStatusClass = computed(() => {
  if (!props.isEditable) return "";

  const todayCheckIn = props.checkIns.find((checkIn) => {
    const checkInDate = new Date(checkIn.date);
    return isToday(checkInDate);
  });

  return todayCheckIn?.completed ? "text-green-500" : "text-gray-500";
});
</script>

<template>
  <div class="w-full font-sans">
    <div v-if="isEditable" class="today-check-in mb-3">
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200 gap-2">
        <div>
          <div class="text-sm font-medium text-gray-700">Today's Check-in</div>
          <div :class="['text-xs font-medium mt-1', todayStatusClass]">
            Status: {{ todayCheckInStatus }}
          </div>
        </div>
        <button
          class="px-3 py-1.5 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center text-sm"
          @click="handleTodayCheckIn">
          {{ todayCheckInStatus === "Completed" ? "Completed" : "Mark Today" }}
        </button>
      </div>
    </div>

    <div class="w-full flex flex-col gap-3">
      <Calendar
        expanded
        :attributes="attributes"
        @dayclick="handleDayClick"
        trim-weeks
        :from="defaultFrom"
        :to="defaultTo">
        <template #day-content="{ day, attributes }">
          <div
            class="flex flex-col items-center justify-center h-full py-1 px-0.5 rounded transition-all duration-200"
            :class="{
              'font-semibold text-green-600': attributes.some(
                
                (attr: any) => attr.customData?.checkIn?.completed
              ),
              'bg-black/5 font-semibold': isToday(new Date(day.id)),
            }">
            <span class="text-sm">{{ day.day }}</span>
            <div class="flex mt-1">
              <span
                v-for="attr in attributes"
                :key="attr.key"
                class="h-2 w-2 rounded-full mx-0.5"
                :class="attr.dot?.class">
              </span>
            </div>
          </div>
        </template>
      </Calendar>
      <div class="w-full">
        <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div
            class="flex flex-col sm:flex-row sm:justify-between gap-6 sm:gap-2">
            <div class="mb-4 sm:mb-0">
              <h3 class="text-sm font-medium text-gray-700 mb-2">
                Check-in Guide
              </h3>
              <div class="flex flex-col space-y-2">
                <div class="flex items-center">
                  <span class="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  <span class="text-xs">Completed</span>
                </div>
                <div class="flex items-center">
                  <span class="h-2 w-2 rounded-full bg-gray-300 mr-2"></span>
                  <span class="text-xs">Not Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-green-500 {
  background-color: #10b981;
}

.bg-gray-300 {
  background-color: #d1d5db;
}
</style>
