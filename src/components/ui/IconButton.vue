<script setup lang="ts">
defineProps<{
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  title?: string;
}>();
</script>

<template>
  <button
    :title="title"
    :class="[
      'inline-flex items-center justify-center rounded-md p-2 transition-colors cursor-pointer',
      {
        'h-8 w-8': size === 'sm' || !size,
        'h-10 w-10': size === 'md',
        'h-12 w-12': size === 'lg',
        'text-gray-800 hover:bg-gray-100': variant === 'primary' || !variant,
        'text-gray-600 hover:bg-gray-50': variant === 'secondary',
        'text-red-800 hover:bg-red-50': variant === 'danger',
        'text-gray-500 hover:bg-gray-50': variant === 'ghost',
      },
    ]">
    <slot />
  </button>
</template>
