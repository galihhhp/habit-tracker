<script setup lang="ts">
import Button from "../ui/Button.vue";
import Modal from "../layout/Modal.vue";

defineProps<{
  isOpen: boolean;
  currentStreak: number;
  longestStreak: number;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();
</script>

<template>
  <Modal
    :is-open="isOpen"
    title="Amazing Streak! 🔥"
    @close="emit('close')"
    size="sm">
    <div class="space-y-4">
      <p class="text-gray-600">
        You've maintained your habit for {{ currentStreak }} days in a row! Your
        longest streak is {{ longestStreak }} days.
      </p>
      <div class="flex justify-end">
        <Button
          variant="primary"
          size="sm"
          title="Close"
          @click="emit('close')">
          Close
        </Button>
      </div>
    </div>
  </Modal>
</template>
