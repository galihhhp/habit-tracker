<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import Button from "./Button.vue";

defineProps<{
  trigger?: string;
  align?: "left" | "right";
}>();

const emit = defineEmits<{
  (e: "open"): void;
  (e: "close"): void;
}>();

const isOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);

const toggleMenu = async (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  isOpen.value = !isOpen.value;

  if (isOpen.value) {
    emit("open");
    await nextTick();
    updatePosition();
  } else {
    emit("close");
  }
};

const updatePosition = () => {
  if (!menuRef.value || !dropdownRef.value) return;

  const menuRect = menuRef.value.getBoundingClientRect();
  const dropdownRect = dropdownRef.value.getBoundingClientRect();
  const viewportWidth = window.innerWidth;

  if (menuRect.right + dropdownRect.width > viewportWidth) {
    dropdownRef.value.style.left = "auto";
    dropdownRef.value.style.right = "0";
  } else {
    dropdownRef.value.style.left = "0";
    dropdownRef.value.style.right = "auto";
  }
};

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    isOpen.value = false;
    emit("close");
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("resize", updatePosition);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("resize", updatePosition);
});
</script>

<template>
  <div class="relative" ref="menuRef">
    <slot name="trigger" :toggle="toggleMenu">
      <Button
        variant="white"
        size="none"
        title="More options"
        @click="toggleMenu">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor">
          <path
            d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </Button>
    </slot>

    <div
      v-if="isOpen"
      ref="dropdownRef"
      class="absolute mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
      :class="{
        'right-0': align === 'right',
        'left-0': align === 'left',
      }">
      <div class="py-1">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
