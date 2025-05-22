<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, reactive, computed } from "vue";
import type { Habit } from "@/services/db";
import { aiService } from "@/services/ai";
import Input from "../ui/Input.vue";
import Button from "../ui/Button.vue";
import Modal from "../layout/Modal.vue";
import TextArea from "../ui/TextArea.vue";
import FrequencyInput from "../ui/FrequencyInput.vue";
import { habitSchema } from "@/schemas/habit";
import { DatePicker } from "v-calendar";
import "v-calendar/dist/style.css";

interface Frequency {
  times: number;
  period: "week";
}

const props = defineProps<{
  isOpen: boolean;
  habit?: Habit | null;
  mode: "add" | "edit";
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (
    e: "save",
    habit: Omit<Habit, "id" | "createdAt" | "updatedAt"> | Habit
  ): void;
}>();

const isGeneratingDescription = ref(false);
const showErrors = ref(false);
const formErrors = reactive({
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  frequency: "",
});

const today = new Date();
today.setHours(0, 0, 0, 0);

const dateRange = ref({
  start: today,
  end: today,
});

const formData = reactive({
  name: "",
  description: "",
  frequency: {
    times: 1,
    period: "week" as const,
  },
});

const isEditMode = computed(() => props.mode === "edit");
const modalTitle = computed(() =>
  isEditMode.value ? "Edit Habit" : "Add New Habit"
);
const submitButtonText = computed(() =>
  isEditMode.value ? "Save Changes" : "Add Habit"
);

const getFieldError = (field: keyof typeof formErrors) => {
  return showErrors.value ? formErrors[field] : "";
};

watch(
  () => props.habit,
  (newHabit) => {
    if (newHabit && isEditMode.value) {
      formData.name = newHabit.name;
      formData.description = newHabit.description || "";

      const startDate = new Date(newHabit.startDate);
      const endDate = new Date(newHabit.endDate);

      dateRange.value = {
        start: startDate,
        end: endDate,
      };

      if (newHabit.frequency) {
        const times =
          newHabit.frequency.period === "week" ? newHabit.frequency.times : 1;

        formData.frequency = {
          times: Math.min(times, 7),
          period: "week" as const,
        };
      } else {
        formData.frequency = {
          times: 1,
          period: "week" as const,
        };
      }
    }
  },
  { immediate: true }
);

const clearErrors = () => {
  formErrors.name = "";
  formErrors.description = "";
  formErrors.startDate = "";
  formErrors.endDate = "";
  formErrors.frequency = "";
};

const resetForm = () => {
  formData.name = "";
  formData.description = "";
  dateRange.value = {
    start: new Date(),
    end: new Date(),
  };
  formData.frequency = {
    times: 1,
    period: "week" as const,
  };
  clearErrors();
};

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      showErrors.value = false;
      if (!isEditMode.value) {
        resetForm();
      }
    } else {
      showErrors.value = false;
    }
  },
  { immediate: true }
);

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

  const result = habitSchema.safeParse({
    ...formData,
    startDate: dateRange.value.start.toISOString(),
    endDate: dateRange.value.end.toISOString(),
  });

  if (!result.success) {
    const { errors } = result.error;
    errors.forEach((err) => {
      const path = err.path[0] as keyof typeof formErrors;
      formErrors[path] = err.message;
    });
    isValid = false;
  }

  if (dateRange.value.start && dateRange.value.end) {
    if (dateRange.value.end < dateRange.value.start) {
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

  if (isEditMode.value && props.habit) {
    emit("save", {
      ...props.habit,
      name: formData.name,
      description: formData.description,
      startDate: dateRange.value.start,
      endDate: dateRange.value.end,
      frequency: {
        times: Number(formData.frequency.times),
        period: formData.frequency.period,
      },
      history: props.habit.history.map((h) => ({
        ...h,
        date: new Date(h.date),
      })),
    });
  } else {
    emit("save", {
      name: formData.name,
      description: formData.description,
      startDate: dateRange.value.start,
      endDate: dateRange.value.end,
      frequency: {
        times: Number(formData.frequency.times),
        period: formData.frequency.period,
      },
      isActive: true,
      history: [],
      completionRate: 0,
    });
  }

  if (!isEditMode.value) {
    resetForm();
  }
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
  <Modal :is-open="isOpen" @close="emit('close')" size="md" :title="modalTitle">
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

      <FrequencyInput
        v-model="formData.frequency"
        :error="getFieldError('frequency')" />

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <DatePicker
          v-model="dateRange"
          is-range
          :min-date="today"
          :masks="{
            input: 'YYYY-MM-DD',
          }"
          class="w-full"
          :class="{
            'border-red-500':
              getFieldError('startDate') || getFieldError('endDate'),
          }">
          <template #default="{ inputValue, inputEvents }">
            <div class="flex items-center border rounded-md overflow-hidden">
              <input
                :value="inputValue.start"
                v-on="inputEvents.start"
                placeholder="Start date"
                class="px-3 py-2 w-1/2 focus:outline-none cursor-pointer" />
              <span class="px-2 text-gray-500 cursor-pointer">to</span>
              <input
                :value="inputValue.end"
                v-on="inputEvents.end"
                placeholder="End date"
                class="px-3 py-2 w-1/2 focus:outline-none cursor-pointer" />
            </div>
          </template>
        </DatePicker>
        <p v-if="getFieldError('startDate')" class="mt-1 text-sm text-red-600">
          {{ getFieldError("startDate") }}
        </p>
        <p v-if="getFieldError('endDate')" class="mt-1 text-sm text-red-600">
          {{ getFieldError("endDate") }}
        </p>
      </div>

      <div class="flex justify-end gap-3">
        <Button variant="secondary" @click="emit('close')">Cancel</Button>
        <Button variant="primary" type="submit">{{ submitButtonText }}</Button>
      </div>
    </form>
  </Modal>
</template>

<style scoped>
:deep(.vc-container) {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  width: 100%;
}

:deep(.vc-highlight) {
  background-color: #4f46e5;
}

:deep(.vc-date-picker-content) {
  width: 100%;
}
</style>
