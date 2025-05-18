import Dexie, { type Table } from "dexie";

export interface Habit {
  id?: number;
  name: string;
  frequency: number;
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
    habits: "++id, name",
    checkIns: "++id, habitId, date, [habitId+date]",
  });
  return db;
};

export const db = createDatabase();

export const habitService = {
  getAll: async () => {
    return await db.table("habits").toArray();
  },

  add: async (habit: Omit<Habit, "id" | "createdAt" | "updatedAt">) => {
    const timestamp = new Date();
    return await db.table("habits").add({
      ...habit,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },

  update: async (id: number, changes: Partial<Omit<Habit, "id" | "createdAt">>) => {
    return await db.table("habits").update(id, {
      ...changes,
      updatedAt: new Date(),
    });
  },

  delete: async (id: number) => {
    await db.table("checkIns").where("habitId").equals(id).delete();
    return await db.table("habits").delete(id);
  },
};

export const checkInService = {
  getForHabit: async (habitId: number, startDate: Date, endDate: Date) => {
    return await db.table("checkIns")
      .where("habitId")
      .equals(habitId)
      .and((checkIn) => checkIn.date >= startDate && checkIn.date <= endDate)
      .toArray();
  },

  getForDate: async (date: Date) => {
    return await db.table("checkIns").where("date").equals(date).toArray();
  },

  toggle: async (habitId: number, date: Date) => {
    const existing = await db.table("checkIns")
      .where(["habitId", "date"])
      .equals([habitId, date])
      .first();

    if (existing) {
      return await db.table("checkIns").update(existing.id!, {
        completed: !existing.completed,
      });
    } else {
      return await db.table("checkIns").add({
        habitId,
        date,
        completed: true,
        createdAt: new Date(),
      });
    }
  },
};
