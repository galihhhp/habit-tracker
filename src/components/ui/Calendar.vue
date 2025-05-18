<script setup lang="ts">
import { computed } from "vue";
import type { CheckIn } from "@/services/db";

const props = defineProps<{
  checkIns: CheckIn[];
  showWeekDays?: boolean;
  isEditable?: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle", date: Date): void;
}>();

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const calendarDays = computed(() => {
  const days = [];
  const today = new Date();
  const currentDay = today.getDay() || 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - (currentDay - 1));

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + i);
    currentDate.setHours(0, 0, 0, 0);

    const checkIn = props.checkIns.find((c) => {
      const checkInDate = new Date(c.date);
      checkInDate.setHours(0, 0, 0, 0);
      return checkInDate.getTime() === currentDate.getTime();
    });

    const isToday = new Date().toDateString() === currentDate.toDateString();

    days.push({
      date: currentDate,
      isCompleted: checkIn?.completed || false,
      isToday,
    });
  }

  return days;
});

const handleClick = (day: { date: Date; isToday: boolean }) => {
  if (props.isEditable && day.isToday) {
    emit("toggle", day.date);
  }
};
</script>

<template>
  <div class="grid grid-cols-7 gap-1">
    <template v-if="showWeekDays">
      <div
        v-for="day in weekDays"
        :key="day"
        class="text-center text-xs font-medium text-gray-500">
        {{ day }}
      </div>
    </template>

    <div
      v-for="day in calendarDays"
      :key="day.date.toISOString()"
      class="h-12 flex items-center justify-center rounded-lg border transition-all duration-300"
      :class="[
        day.isCompleted ? 'bg-gray-800 text-white' : 'text-black',
        day.isToday ? 'border-gray-800' : 'border-gray-200',
        day.isToday && props.isEditable
          ? 'hover:bg-gray-700 hover:text-white cursor-pointer'
          : 'cursor-default',
      ]"
      @click="handleClick(day)">
      <span class="text-xs">
        {{ day.date.getDate() }}
      </span>
    </div>
  </div>
</template>
