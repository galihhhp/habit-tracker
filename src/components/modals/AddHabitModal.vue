<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { Habit } from "@/services/db";
import Input from "../ui/Input.vue";
import Button from "../ui/Button.vue";
import Modal from "../ui/Modal.vue";
import { aiService } from "@/services/ai";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", habit: Omit<Habit, "id" | "createdAt" | "updatedAt">): void;
}>();

const name = ref("");
const description = ref("");
const startDate = ref("");
const endDate = ref("");
const isGeneratingDescription = ref(false);

const generateDescription = async () => {
  if (!name.value.trim() || isGeneratingDescription.value) return;

  isGeneratingDescription.value = true;
  try {
    description.value = await aiService.getHabitDescription(name.value);
  } catch (error) {
    console.error("Failed to generate description:", error);
  } finally {
    isGeneratingDescription.value = false;
  }
};

const handleSubmit = () => {
  if (!name.value.trim() || !startDate.value || !endDate.value) return;

  const start = new Date(startDate.value);
  const end = new Date(endDate.value);

  if (end < start) {
    alert("End date must be after start date");
    return;
  }

  emit("save", {
    name: name.value.trim(),
    description: description.value.trim(),
    startDate: start,
    endDate: end,
    isActive: true,
    history: [],
    completionRate: 0,
  });

  name.value = "";
  description.value = "";
  startDate.value = "";
  endDate.value = "";
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

        <Input v-model="endDate" label="End Date" type="date" required />
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="emit('close')">Cancel</Button>
          <Button variant="primary" type="submit">Add Habit</Button>
        </div>
      </form>
    </div>
  </Modal>
</template>
