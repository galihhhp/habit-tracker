<script setup lang="ts">
import Button from "../ui/Button.vue";
import Modal from "../ui/Modal.vue";

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();
</script>

<template>
  <Modal :is-open="isOpen" title="Great job! 🎉" @close="emit('close')">
    <div class="space-y-4">
      <p class="text-gray-600">
        You've completed your habit for today. Keep up the good work!
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
