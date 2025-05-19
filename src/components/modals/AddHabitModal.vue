<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { Habit } from "@/services/db";
import Input from "../ui/Input.vue";
import Select from "../ui/Select.vue";
import Button from "../ui/Button.vue";
import Modal from "../ui/Modal.vue";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", habit: Omit<Habit, "id" | "createdAt" | "updatedAt">): void;
}>();

const name = ref("");
const description = ref("");
const frequency = ref<"daily" | "weekly" | "monthly">("daily");
const targetDays = ref("1");

const frequencyOptions = [
  { value: "daily" as const, label: "Daily" },
  { value: "weekly" as const, label: "Weekly" },
  { value: "monthly" as const, label: "Monthly" },
];

const handleSubmit = () => {
  if (!name.value.trim()) return;

  emit("save", {
    name: name.value.trim(),
    description: description.value.trim(),
    frequency: frequency.value,
    targetDays: Number(targetDays.value),
    isActive: true,
    history: [],
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0,
  });
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (!props.isOpen) return;

  if (e.key === "Escape") {
    emit("close");
  } else if (e.key === "Enter" && e.ctrlKey) {
    handleSubmit();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
  <Modal :is-open="isOpen" @close="emit('close')">
    <div class="p-2">
      <h2 class="text-lg font-medium text-gray-900 mb-4">Add New Habit</h2>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <Input
          v-model="name"
          label="Name"
          placeholder="Enter habit name"
          required />

        <Input
          v-model="description"
          label="Description"
          placeholder="Enter habit description"
          type="textarea" />

        <Select
          v-model="frequency"
          :options="frequencyOptions"
          label="Frequency"
          required />

        <Input
          v-model="targetDays"
          label="Target Days"
          type="number"
          min="1"
          :max="frequency === 'daily' ? 7 : frequency === 'weekly' ? 7 : 31"
          required />

        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="emit('close')">Cancel</Button>
          <Button variant="primary" type="submit">Add Habit</Button>
        </div>
      </form>
    </div>
  </Modal>
</template>
