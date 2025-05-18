<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

const props = defineProps<{
  isOpen: boolean;
  title?: string;
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
        class="relative transform overflow-hidden rounded-lg bg-white p-6 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
        <div v-if="title" class="mb-4">
          <h3 class="text-lg font-medium leading-6 text-gray-900">
            {{ title }}
          </h3>
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
