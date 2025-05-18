<script setup lang="ts">
import HabitList from "./components/HabitList.vue";
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-4 py-5">
        <h1 class="font-medium text-xl text-gray-900">Habit Tracker</h1>
      </div>
    </header>

    <main class="max-w-4xl mx-auto">
      <HabitList />
    </main>
  </div>
</template>

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #374151;
  line-height: 1.5;
}
</style>
