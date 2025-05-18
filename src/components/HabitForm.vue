<script setup lang="ts">
import { ref } from "vue";
import type { Habit } from "../services/db";
import Input from "./ui/Input.vue";
import Select from "./ui/Select.vue";
import Button from "./ui/Button.vue";

const emit = defineEmits(["submit"]);

const name = ref("");
const frequency = ref(3);

const frequencyOptions = [
  { value: 1, label: "1 day per week" },
  { value: 2, label: "2 days per week" },
  { value: 3, label: "3 days per week" },
  { value: 4, label: "4 days per week" },
  { value: 5, label: "5 days per week" },
  { value: 6, label: "6 days per week" },
  { value: 7, label: "Daily" },
];

const submit = () => {
  if (!name.value.trim()) {
    alert("Please enter a habit name");
    return;
  }

  const newHabit: Omit<Habit, "id" | "createdAt" | "updatedAt"> = {
    name: name.value.trim(),
    frequency: frequency.value,
  };

  emit("submit", newHabit);

  name.value = "";
  frequency.value = 3;
};
</script>

<template>
  <form @submit.prevent="submit" class="space-y-6">
    <h2 class="text-xl font-medium tracking-tight">New Habit</h2>

    <Input
      v-model="name"
      label="Habit Name"
      placeholder="e.g., Drink water"
      required />

    <Select
      v-model="frequency"
      :options="frequencyOptions"
      label="Weekly Target" />

    <Button type="submit" fullWidth> Save Habit </Button>
  </form>
</template>
