<script setup lang="ts">
import { ref, computed } from "vue";
import type { Habit } from "@/services/db";
import Input from "../ui/Input.vue";
import Select from "../ui/Select.vue";
import Button from "../ui/Button.vue";
import Modal from "../ui/Modal.vue";

const props = defineProps<{
  isOpen: boolean;
  habit: Habit;
}>();

const emit = defineEmits(["close", "save"]);

const editedName = ref(props.habit.name);
const editedFrequency = ref(props.habit.frequency);

const frequencyOptions = [
  { value: 1, label: "1 day per week" },
  { value: 2, label: "2 days per week" },
  { value: 3, label: "3 days per week" },
  { value: 4, label: "4 days per week" },
  { value: 5, label: "5 days per week" },
  { value: 6, label: "6 days per week" },
  { value: 7, label: "Daily" },
];

const handleSave = () => {
  if (!editedName.value.trim()) {
    alert("Please enter a habit name");
    return;
  }

  emit("save", {
    ...props.habit,
    name: editedName.value.trim(),
    frequency: editedFrequency.value,
  });
  emit("close");
};

const handleClose = () => {
  editedName.value = props.habit.name;
  editedFrequency.value = props.habit.frequency;
  emit("close");
};
</script>

<template>
  <Modal :is-open="isOpen" @close="handleClose">
    <div class="p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Edit Habit</h2>

      <div class="space-y-4">
        <Input
          v-model="editedName"
          label="Habit Name"
          placeholder="Enter habit name"
          required />

        <Select
          v-model="editedFrequency"
          :options="frequencyOptions"
          label="Weekly Target" />

        <div class="flex justify-end space-x-2 mt-6">
          <Button
            variant="secondary"
            size="sm"
            title="Cancel"
            @click="handleClose">
            <img src="@/assets/icons/x.svg" class="h-4 w-4" alt="Cancel" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            title="Save changes"
            @click="handleSave">
            <img src="@/assets/icons/check.svg" class="h-4 w-4" alt="Save" />
          </Button>
        </div>
      </div>
    </div>
  </Modal>
</template>
