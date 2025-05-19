<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import Button from "../ui/Button.vue";
import Modal from "../ui/Modal.vue";

const props = defineProps<{
  isOpen: boolean;
  habitName: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm"): void;
}>();

const handleKeyDown = (e: KeyboardEvent) => {
  if (!props.isOpen) return;

  if (e.key === "Escape") {
    emit("close");
  } else if (e.key === "Enter") {
    emit("confirm");
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
      <h2 class="text-lg font-medium text-gray-900 mb-4">Delete Habit</h2>
      <p class="text-gray-600 mb-6">
        Are you sure you want to delete "{{ habitName }}"? This action cannot be
        undone.
      </p>
      <div class="flex justify-end gap-3">
        <Button variant="secondary" @click="emit('close')">Cancel</Button>
        <Button variant="danger" @click="emit('confirm')">Delete</Button>
      </div>
    </div>
  </Modal>
</template>
