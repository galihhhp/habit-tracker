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
  frequency: {
    times: number;
    period: "week";
  };
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
    dailyPrediction?: string;
    frequencyPrediction?: string;
    overexertionWarning?: string;
  };
}

export interface CheckIn {
  id?: number;
  habitId: number;
  date: Date;
  completed: boolean;
  createdAt: Date;
}

export interface EarnedAchievement {
  id?: number;
  habitId: number;
  achievementId: string;
  earnedAt: Date;
}

const createDatabase = () => {
  const db = new Dexie("HabitTrackerDB");

  db.version(3).stores({
    habits: "++id, name, isActive, currentStreak, completionRate",
    checkIns: "++id, habitId, date, [habitId+date]",
    achievements: "++id, habitId, achievementId, [habitId+achievementId]",
  });

  db.on("versionchange", function (event) {
    window.location.reload();
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
    return habits.map((habit) => {
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
        history: habit.history.map(
          (h: { date: Date | string; completed: boolean }) => ({
            ...h,
            date: new Date(h.date),
          })
        ),
      };
    });
  },

  add: async (habit: Omit<Habit, "id" | "createdAt" | "updatedAt">) => {
    const timestamp = new Date();
    const newHabit = {
      name: habit.name,
      description: habit.description || "",
      startDate: new Date(habit.startDate).toISOString(),
      endDate: new Date(habit.endDate).toISOString(),
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString(),
      isActive: habit.isActive,
      frequency: {
        times: Number(habit.frequency.times),
        period: habit.frequency.period,
      },
      history: (habit.history || []).map(
        (h: { date: Date | string; completed: boolean }) => ({
          date:
            h.date instanceof Date
              ? h.date.toISOString()
              : new Date(h.date).toISOString(),
          completed: !!h.completed,
        })
      ),
      completionRate: habit.completionRate || 0,
      predictions: habit.predictions
        ? JSON.parse(JSON.stringify(habit.predictions))
        : undefined,
    };
    return await db.table("habits").add(newHabit);
  },

  update: async (
    id: number,
    changes: Partial<Omit<Habit, "id" | "createdAt">>
  ) => {
    const updateData = {
      ...changes,
      updatedAt: new Date().toISOString(),
    };

    if (updateData.startDate instanceof Date) {
      updateData.startDate = updateData.startDate.toISOString();
    }
    if (updateData.endDate instanceof Date) {
      updateData.endDate = updateData.endDate.toISOString();
    }
    if (updateData.history) {
      updateData.history = updateData.history.map(
        (h: { date: Date | string; completed: boolean }) => ({
          date: h.date instanceof Date ? h.date.toISOString() : h.date,
          completed: !!h.completed,
        })
      );
    }

    if (updateData.frequency) {
      updateData.frequency = {
        times: Number(updateData.frequency.times),
        period: updateData.frequency.period,
      };
    }

    if (updateData.predictions) {
      updateData.predictions = JSON.parse(
        JSON.stringify(updateData.predictions)
      );
    }

    return await db.table("habits").update(id, updateData);
  },

  delete: async (id: number) => {
    await db.table("checkIns").where("habitId").equals(id).delete();
    await db.table("achievements").where("habitId").equals(id).delete();
    return await db.table("habits").delete(id);
  },
};

export const checkInService = {
  getForHabit: async (habitId: number, startDate: Date, endDate: Date) => {
    const checkIns = await db
      .table("checkIns")
      .where("habitId")
      .equals(habitId)
      .and((checkIn) => {
        const date = new Date(checkIn.date);
        return date >= startDate && date <= endDate;
      })
      .toArray();

    return checkIns.map((checkIn) => ({
      ...checkIn,
      date: new Date(checkIn.date),
      createdAt: new Date(checkIn.createdAt),
    }));
  },

  getForDate: async (date: Date) => {
    const checkIns = await db
      .table("checkIns")
      .where("date")
      .equals(date)
      .toArray();

    return checkIns.map((checkIn) => ({
      ...checkIn,
      date: new Date(checkIn.date),
      createdAt: new Date(checkIn.createdAt),
    }));
  },

  toggle: async (habitId: number, date: Date) => {
    const existing = await db
      .table("checkIns")
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

export const achievementService = {
  getAllForHabit: async (habitId: number) => {
    try {
      if (!db.tables.some((table) => table.name === "achievements")) {
        return [];
      }

      const achievements = await db
        .table("achievements")
        .where("habitId")
        .equals(habitId)
        .toArray();

      return achievements.map((achievement) => ({
        ...achievement,
        earnedAt: new Date(achievement.earnedAt),
      }));
    } catch (error) {
      return [];
    }
  },

  saveAchievement: async (habitId: number, achievementId: string) => {
    try {
      if (!db.tables.some((table) => table.name === "achievements")) {
        return null;
      }

      const existing = await db
        .table("achievements")
        .where(["habitId", "achievementId"])
        .equals([habitId, achievementId])
        .first();

      if (!existing) {
        return await db.table("achievements").add({
          habitId,
          achievementId,
          earnedAt: new Date(),
        });
      }

      return existing.id;
    } catch (error) {
      return null;
    }
  },

  removeAchievement: async (habitId: number, achievementId: string) => {
    try {
      if (!db.tables.some((table) => table.name === "achievements")) {
        return false;
      }

      const achievementRecord = await db
        .table("achievements")
        .where(["habitId", "achievementId"])
        .equals([habitId, achievementId])
        .first();

      if (achievementRecord && achievementRecord.id) {
        await db.table("achievements").delete(achievementRecord.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error removing achievement:", error);
      return false;
    }
  },
};
