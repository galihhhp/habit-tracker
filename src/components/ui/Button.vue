<script setup lang="ts">
defineProps<{
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
}>();
</script>

<template>
  <button
    :type="type || 'button'"
    :class="[
      'inline-flex items-center justify-center rounded-md font-medium transition-colors cursor-pointer',
      {
        'w-full': fullWidth,
        'px-3 py-1.5 text-sm': size === 'sm',
        'px-4 py-2 text-base': size === 'md' || !size,
        'px-5 py-2.5 text-lg': size === 'lg',
        'bg-gray-800 hover:bg-gray-700 text-white':
          variant === 'primary' || !variant,
        'bg-gray-100 hover:bg-gray-200 text-gray-800': variant === 'secondary',
        'bg-red-100 hover:bg-red-200 text-red-800': variant === 'danger',
        'text-gray-600 hover:text-gray-800 hover:bg-gray-50':
          variant === 'ghost',
      },
    ]">
    <slot />
  </button>
</template>
