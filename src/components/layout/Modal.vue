<script setup lang="ts">
import { onMounted, onUnmounted, computed } from "vue";

const props = defineProps<{
  isOpen: boolean;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
}>();

const emit = defineEmits(["close"]);

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === "Escape" && props.isOpen) {
    emit("close");
  }
};

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains("modal-overlay") && props.isOpen) {
    emit("close");
  }
};

const modalSizeClass = computed(() => {
  switch (props.size) {
    case "sm":
      return "sm:max-w-sm";
    case "md":
      return "sm:max-w-md";
    case "lg":
      return "sm:max-w-lg";
    case "xl":
      return "sm:max-w-xl";
    default:
      return "sm:max-w-lg";
  }
});

onMounted(() => {
  document.addEventListener("keydown", handleEscape);
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscape);
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center p-4 text-center">
      <div
        class="modal-overlay fixed inset-0 bg-black/10 bg-opacity-25 transition-opacity" />

      <div
        :class="[
          'relative transform overflow-hidden rounded-lg bg-white p-4 text-left shadow-xl transition-all',
          'sm:my-8 sm:w-full w-full',
          modalSizeClass,
        ]">
        <div v-if="title" class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-medium leading-6 text-gray-900">
            {{ title }}
          </h3>
          <button
            @click="emit('close')"
            class="rounded-full p-1 hover:bg-gray-100 transition-colors duration-200"
            type="button"
            aria-label="Close">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-gray-500"
              viewBox="0 0 20 20"
              fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <div v-else class="flex justify-end mb-2">
          <button
            @click="emit('close')"
            class="rounded-full p-1 hover:bg-gray-100 transition-colors duration-200"
            type="button"
            aria-label="Close">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-gray-500"
              viewBox="0 0 20 20"
              fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <div class="mt-2">
          <slot />
        </div>

        <div class="mt-4 flex justify-end">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </div>
</template>
