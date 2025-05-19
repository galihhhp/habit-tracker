import Dexie, { type Table } from "dexie";

export interface Habit {
  id?: number;
  name: string;
  description?: string;
  startDate: Date | string;
  endDate: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  isActive: boolean;
  history: Array<{
    date: Date | string;
    completed: boolean;
  }>;
  completionRate: number;
  predictions?: {
    milestones: Array<{
      period: string;
      prediction: string;
    }>;
    targetPrediction: string;
  };
}

export interface CheckIn {
  id?: number;
  habitId: number;
  date: Date;
  completed: boolean;
  createdAt: Date;
}

const createDatabase = () => {
  const db = new Dexie("HabitTrackerDB");
  db.version(1).stores({
    habits: "++id, name, isActive, currentStreak, completionRate",
    checkIns: "++id, habitId, date, [habitId+date]",
  });

  return db;
};

export const db = createDatabase();

const checkInactivity = (habit: Habit): boolean => {
  const lastCheckIn = habit.history[habit.history.length - 1];
  if (!lastCheckIn) return false;

  const daysSinceLastCheckIn = Math.floor(
    (new Date().getTime() - new Date(lastCheckIn.date).getTime()) /
    (1000 * 60 * 60 * 24)
  );

  return daysSinceLastCheckIn >= 14;
};

export const habitService = {
  getAll: async () => {
    const habits = await db.table("habits").toArray();
    return habits.map(habit => {
      const isInactive = checkInactivity(habit);
      if (isInactive && habit.isActive) {
        db.table("habits").update(habit.id!, { isActive: false });
      }

      return {
        ...habit,
        isActive: !isInactive,
        startDate: new Date(habit.startDate),
        endDate: new Date(habit.endDate),
        createdAt: new Date(habit.createdAt),
        updatedAt: new Date(habit.updatedAt),
        history: habit.history.map((h: { date: Date | string; completed: boolean }) => ({
          ...h,
          date: new Date(h.date)
        }))
      };
    });
  },

  add: async (habit: Omit<Habit, "id" | "createdAt" | "updatedAt">) => {
    const timestamp = new Date();
    const newHabit = {
      ...habit,
      startDate: new Date(habit.startDate).toISOString(),
      endDate: new Date(habit.endDate).toISOString(),
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString(),
      history: habit.history.map((h: { date: Date | string; completed: boolean }) => ({
        ...h,
        date: new Date(h.date).toISOString()
      })),
      completionRate: 0
    };
    return await db.table("habits").add(newHabit);
  },

  update: async (id: number, changes: Partial<Omit<Habit, "id" | "createdAt">>) => {
    const updateData = {
      ...changes,
      updatedAt: new Date().toISOString()
    };

    // Convert any Date objects to ISO strings
    if (updateData.startDate instanceof Date) {
      updateData.startDate = updateData.startDate.toISOString();
    }
    if (updateData.endDate instanceof Date) {
      updateData.endDate = updateData.endDate.toISOString();
    }
    if (updateData.history) {
      updateData.history = updateData.history.map((h: { date: Date | string; completed: boolean }) => ({
        ...h,
        date: h.date instanceof Date ? h.date.toISOString() : h.date
      }));
    }

    return await db.table("habits").update(id, updateData);
  },

  delete: async (id: number) => {
    await db.table("checkIns").where("habitId").equals(id).delete();
    return await db.table("habits").delete(id);
  }
};

export const checkInService = {
  getForHabit: async (habitId: number, startDate: Date, endDate: Date) => {
    const checkIns = await db.table("checkIns")
      .where("habitId")
      .equals(habitId)
      .and(checkIn => {
        const date = new Date(checkIn.date);
        return date >= startDate && date <= endDate;
      })
      .toArray();

    return checkIns.map(checkIn => ({
      ...checkIn,
      date: new Date(checkIn.date),
      createdAt: new Date(checkIn.createdAt)
    }));
  },

  getForDate: async (date: Date) => {
    const checkIns = await db.table("checkIns")
      .where("date")
      .equals(date)
      .toArray();

    return checkIns.map(checkIn => ({
      ...checkIn,
      date: new Date(checkIn.date),
      createdAt: new Date(checkIn.createdAt)
    }));
  },

  toggle: async (habitId: number, date: Date) => {
    const existing = await db.table("checkIns")
      .where(["habitId", "date"])
      .equals([habitId, date])
      .first();

    if (existing) {
      return await db.table("checkIns").update(existing.id!, {
        completed: !existing.completed
      });
    } else {
      return await db.table("checkIns").add({
        habitId,
        date,
        completed: true,
        createdAt: new Date()
      });
    }
  }
};
