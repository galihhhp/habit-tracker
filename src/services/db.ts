import Dexie, { type Table } from "dexie";

export interface Habit {
  id?: number;
  name: string;
  description: string;
  targetDays: number;
  frequency: "daily" | "weekly" | "monthly";
  isActive: boolean;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  history: Array<{
    date: Date;
    completed: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
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
        createdAt: new Date(habit.createdAt),
        updatedAt: new Date(habit.updatedAt),
        history: habit.history.map((h: { date: string | number | Date }) => ({
          ...h,
          date: new Date(h.date),
        })),
      };
    });
  },

  add: async (habit: Omit<Habit, "id" | "createdAt" | "updatedAt">) => {
    const timestamp = new Date();
    return await db.table("habits").add({
      ...habit,
      createdAt: timestamp,
      updatedAt: timestamp,
      history: [],
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
    });
  },

  update: async (id: number, changes: Partial<Omit<Habit, "id" | "createdAt">>) => {
    return await db.table("habits").update(id, {
      ...changes,
      updatedAt: new Date()
    });
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
