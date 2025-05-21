<script setup lang="ts">
import { computed } from "vue";
import Button from "../ui/Button.vue";

const props = defineProps<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}>();

const emit = defineEmits<{
  (e: "page-change", page: number): void;
}>();

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = window.innerWidth < 640 ? 3 : 5;
  const halfVisible = Math.floor(maxVisible / 2);

  let start = Math.max(1, props.currentPage - halfVisible);
  let end = Math.min(props.totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit("page-change", page);
  }
};
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
    <div class="text-sm text-gray-600">
      Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to
      {{ Math.min(currentPage * itemsPerPage, totalItems) }} of
      {{ totalItems }} items
    </div>
    <div class="flex items-center gap-2">
      <Button
        variant="secondary"
        :disabled="currentPage === 1"
        @click="handlePageChange(currentPage - 1)"
        class="p-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clip-rule="evenodd" />
        </svg>
      </Button>

      <div class="flex items-center gap-1">
        <template v-for="page in visiblePages" :key="page">
          <Button
            v-if="page === 1 && page !== visiblePages[0]"
            variant="secondary"
            class="px-3 py-1"
            @click="handlePageChange(1)">
            1
          </Button>
          <div
            v-if="page === 1 && page !== visiblePages[0]"
            class="px-2 text-gray-500">
            ...
          </div>
          <Button
            :variant="page === currentPage ? 'primary' : 'secondary'"
            class="px-3 py-1"
            @click="handlePageChange(page)">
            {{ page }}
          </Button>
          <div
            v-if="
              page === props.totalPages &&
              page !== visiblePages[visiblePages.length - 1]
            "
            class="px-2 text-gray-500">
            ...
          </div>
          <Button
            v-if="
              page === props.totalPages &&
              page !== visiblePages[visiblePages.length - 1]
            "
            variant="secondary"
            class="px-3 py-1"
            @click="handlePageChange(props.totalPages)">
            {{ props.totalPages }}
          </Button>
        </template>
      </div>

      <Button
        variant="secondary"
        :disabled="currentPage === totalPages"
        @click="handlePageChange(currentPage + 1)"
        class="p-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd" />
        </svg>
      </Button>
    </div>
  </div>
</template>
