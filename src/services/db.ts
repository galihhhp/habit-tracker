import Dexie, { type Table } from "dexie";

export interface Habit {
  id?: number;
  name: string;
  frequency: number;
  createdAt: Date;
  updatedAt: Date;
}

class HabitDatabase extends Dexie {
  habits!: Table<Habit>;

  constructor() {
    super("HabitTrackerDB");
    this.version(1).stores({
      habits: "++id, name",
    });
  }
}

export const db = new HabitDatabase();

export const habitService = {
  async getAll() {
    return await db.habits.toArray();
  },

  async add(habit: Omit<Habit, "id" | "createdAt" | "updatedAt">) {
    const timestamp = new Date();
    return await db.habits.add({
      ...habit,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },

  async update(id: number, changes: Partial<Omit<Habit, "id" | "createdAt">>) {
    return await db.habits.update(id, {
      ...changes,
      updatedAt: new Date(),
    });
  },

  async delete(id: number) {
    return await db.habits.delete(id);
  },
};
