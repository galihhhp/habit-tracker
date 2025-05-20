<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, reactive } from "vue";
import type { Habit } from "@/services/db";
import Input from "../ui/Input.vue";
import Button from "../ui/Button.vue";
import Modal from "../ui/Modal.vue";
import TextArea from "../ui/TextArea.vue";
import { aiService } from "@/services/ai";
import { habitSchema } from "@/schemas/habit";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", habit: Omit<Habit, "id" | "createdAt" | "updatedAt">): void;
}>();

const isGeneratingDescription = ref(false);
const showErrors = ref(false);
const formErrors = reactive({
  name: "",
  description: "",
  startDate: "",
  endDate: "",
});

const formData = reactive({
  name: "",
  description: "",
  startDate: "",
  endDate: "",
});

const clearErrors = () => {
  formErrors.name = "";
  formErrors.description = "";
  formErrors.startDate = "";
  formErrors.endDate = "";
};

const resetForm = () => {
  formData.name = "";
  formData.description = "";
  formData.startDate = "";
  formData.endDate = "";
  clearErrors();
};

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      showErrors.value = false;
      resetForm();
    } else {
      showErrors.value = false;
    }
  },
  { immediate: true }
);

const getFieldError = (field: keyof typeof formErrors) => {
  return showErrors.value ? formErrors[field] : "";
};

const generateDescription = async () => {
  if (!formData.name || isGeneratingDescription.value) return;

  isGeneratingDescription.value = true;
  try {
    formData.description = await aiService.getHabitDescription(formData.name);
  } catch (error) {
    console.log(error);
  } finally {
    isGeneratingDescription.value = false;
  }
};

const validateForm = () => {
  clearErrors();
  let isValid = true;

  const result = habitSchema.safeParse(formData);
  if (!result.success) {
    const { errors } = result.error;
    errors.forEach((err) => {
      const path = err.path[0] as keyof typeof formErrors;
      formErrors[path] = err.message;
    });
    isValid = false;
  }

  if (formData.startDate && formData.endDate) {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) {
      formErrors.endDate = "End date must be after start date";
      isValid = false;
    }
  }

  return isValid;
};

const onSubmit = () => {
  showErrors.value = true;

  if (!validateForm()) {
    return;
  }

  const start = new Date(formData.startDate);
  const end = new Date(formData.endDate);

  emit("save", {
    name: formData.name,
    description: formData.description,
    startDate: start,
    endDate: end,
    isActive: true,
    history: [],
    completionRate: 0,
  });

  resetForm();
  showErrors.value = false;
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (!props.isOpen) return;

  if (e.key === "Escape") {
    emit("close");
  } else if (e.key === "Enter" && e.ctrlKey) {
    onSubmit();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
  <Modal :is-open="isOpen" @close="emit('close')">
    <div class="p-2">
      <h2 class="text-lg font-medium text-gray-900 mb-4">Add New Habit</h2>
      <form @submit.prevent="onSubmit" class="space-y-4">
        <Input
          v-model="formData.name"
          label="Name"
          placeholder="Enter habit name"
          :error="getFieldError('name')" />

        <div class="flex justify-between items-center">
          <label class="block text-sm font-medium text-gray-700"
            >Description</label
          >
          <Button
            type="button"
            variant="secondary"
            size="sm"
            :loading="isGeneratingDescription"
            @click="generateDescription">
            {{
              isGeneratingDescription ? "Generating..." : "✨ Generate with AI"
            }}
          </Button>
        </div>
        <TextArea
          v-model="formData.description"
          :rows="3"
          :maxLength="250"
          placeholder="Describe your habit (required, max 250 characters)"
          :error="getFieldError('description')" />

        <Input
          v-model="formData.startDate"
          label="Start Date"
          type="date"
          :error="getFieldError('startDate')" />

        <Input
          v-model="formData.endDate"
          label="End Date"
          type="date"
          :error="getFieldError('endDate')" />

        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="emit('close')">Cancel</Button>
          <Button variant="primary" type="submit">Add Habit</Button>
        </div>
      </form>
    </div>
  </Modal>
</template>
