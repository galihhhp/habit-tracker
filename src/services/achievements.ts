import { ref, reactive } from "vue";
import { achievementService } from "./db";

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  type: "streak" | "completion" | "milestone";
  requirement: number;
};

const achievements: Achievement[] = [
  {
    id: "first_checkin",
    name: "First Step",
    description: "Complete your first check-in",
    icon: "🌟",
    points: 5,
    type: "milestone",
    requirement: 1,
  },
  {
    id: "streak_3",
    name: "Getting Started",
    description: "Maintain a 3-day streak",
    icon: "🔥",
    points: 10,
    type: "streak" as const,
    requirement: 3,
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "⚡",
    points: 25,
    type: "streak" as const,
    requirement: 7,
  },
  {
    id: "streak_14",
    name: "Fortnight Fighter",
    description: "Maintain a 14-day streak",
    icon: "💪",
    points: 50,
    type: "streak" as const,
    requirement: 14,
  },
  {
    id: "streak_30",
    name: "Monthly Master",
    description: "Maintain a 30-day streak",
    icon: "👑",
    points: 100,
    type: "streak" as const,
    requirement: 30,
  },
  {
    id: "completion_10",
    name: "Consistent",
    description: "Complete 10 habit check-ins",
    icon: "✅",
    points: 15,
    type: "completion" as const,
    requirement: 10,
  },
  {
    id: "completion_25",
    name: "Regular",
    description: "Complete 25 habit check-ins",
    icon: "📝",
    points: 30,
    type: "completion" as const,
    requirement: 25,
  },
  {
    id: "completion_50",
    name: "Dedicated",
    description: "Complete 50 habit check-ins",
    icon: "🎯",
    points: 50,
    type: "completion" as const,
    requirement: 50,
  },
  {
    id: "completion_100",
    name: "Century Club",
    description: "Complete 100 habit check-ins",
    icon: "💯",
    points: 100,
    type: "completion" as const,
    requirement: 100,
  },
];

const earnedAchievementsCache = reactive(new Map<number, Set<string>>());

const loadEarnedAchievements = async (habitId: number) => {
  try {
    if (!earnedAchievementsCache.has(habitId)) {
      earnedAchievementsCache.set(habitId, new Set<string>());
    }

    const storedAchievements = await achievementService.getAllForHabit(habitId);
    const cachedSet = earnedAchievementsCache.get(habitId)!;

    storedAchievements.forEach((achievement) => {
      cachedSet.add(achievement.achievementId);
    });

    return cachedSet;
  } catch (error) {
    return new Set<string>();
  }
};

export const checkAchievements = async (
  habitId: number,
  currentStreak: number,
  totalCompletions: number
) => {
  try {
    const earned = await loadEarnedAchievements(habitId);
    const newAchievements: Achievement[] = [];

    const checkAndSaveAchievement = async (
      achievement: Achievement,
      condition: boolean
    ) => {
      if (earned.has(achievement.id) || !condition) return;

      earned.add(achievement.id);
      newAchievements.push(achievement);
      try {
        await achievementService.saveAchievement(habitId, achievement.id);
      } catch (error) {
        console.log(achievement.id, error);
      }
    };

    for (const achievement of achievements) {
      if (achievement.type === "streak") {
        await checkAndSaveAchievement(
          achievement,
          currentStreak >= achievement.requirement
        );
      } else if (achievement.type === "completion") {
        await checkAndSaveAchievement(
          achievement,
          totalCompletions >= achievement.requirement
        );
      } else if (
        achievement.type === "milestone" &&
        achievement.id === "first_checkin"
      ) {
        await checkAndSaveAchievement(achievement, totalCompletions === 1);
      }
    }

    return newAchievements;
  } catch (error) {
    return [];
  }
};

export const getEarnedAchievements = async (habitId: number) => {
  try {
    const earned = await loadEarnedAchievements(habitId);
    return achievements.filter((a) => earned.has(a.id));
  } catch (error) {
    return [];
  }
};

export const getTotalPoints = async (habitId: number) => {
  try {
    const earned = await getEarnedAchievements(habitId);
    return earned.reduce((total, achievement) => total + achievement.points, 0);
  } catch (error) {
    return 0;
  }
};
