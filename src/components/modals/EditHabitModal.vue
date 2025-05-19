<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import type { Habit } from "@/services/db";
import { aiService } from "@/services/ai";
import Input from "../ui/Input.vue";
import Select from "../ui/Select.vue";
import Button from "../ui/Button.vue";
import Modal from "../ui/Modal.vue";

const props = defineProps<{
  isOpen: boolean;
  habit: Habit;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", habit: Habit): void;
}>();

const name = ref("");
const description = ref("");
const startDate = ref("");
const endDate = ref("");

const minEndDate = computed(() => startDate.value || "");

const isGeneratingDescription = ref(false);

watch(
  () => props.habit,
  (newHabit) => {
    if (newHabit) {
      name.value = newHabit.name;
      description.value = newHabit.description || "";
      startDate.value = newHabit.startDate.toISOString().split("T")[0];
      endDate.value = newHabit.endDate.toISOString().split("T")[0];
    }
  },
  { immediate: true }
);

const handleSubmit = () => {
  if (!name.value.trim() || !startDate.value || !endDate.value) return;

  const start = new Date(startDate.value);
  const end = new Date(endDate.value);

  if (end < start) {
    alert("End date must be after start date");
    return;
  }

  emit("save", {
    ...props.habit,
    name: name.value.trim(),
    description: description.value.trim(),
    startDate: start,
    endDate: end,
    history: props.habit.history.map((h) => ({
      ...h,
      date: new Date(h.date),
    })),
  });
};

const generateDescription = async () => {
  if (!name.value || isGeneratingDescription.value) return;

  isGeneratingDescription.value = true;
  try {
    const aiDescription = await aiService.getHabitDescription(name.value);
    description.value = aiDescription;
  } catch (error) {
    console.error("Failed to generate description:", error);
  } finally {
    isGeneratingDescription.value = false;
  }
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
    <div class="p-6">
      <h2 class="text-lg font-medium text-gray-900 mb-4">Edit Habit</h2>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <Input
          v-model="name"
          label="Name"
          placeholder="Enter habit name"
          required />

        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <label class="block text-sm font-medium text-gray-700"
              >Description</label
            >
            <Button
              type="button"
              variant="secondary"
              size="sm"
              :loading="isGeneratingDescription"
              @click="generateDescription">
              {{
                isGeneratingDescription
                  ? "Generating..."
                  : "✨ Generate with AI"
              }}
            </Button>
          </div>
          <textarea
            v-model="description"
            rows="3"
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-gray-800 focus:ring-gray-800"
            placeholder="Describe your habit"></textarea>
        </div>

        <Input v-model="startDate" label="Start Date" type="date" required />

        <Input
          v-model="endDate"
          label="End Date"
          type="date"
          :min="minEndDate"
          required />

        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="emit('close')">Cancel</Button>
          <Button variant="primary" type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  </Modal>
</template>
