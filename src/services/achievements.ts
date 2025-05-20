import { ref } from "vue";

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

const earnedAchievements = ref<Map<number, Set<string>>>(new Map());

export const checkAchievements = async (
  habitId: number,
  currentStreak: number,
  totalCompletions: number
) => {
  const earned = earnedAchievements.value.get(habitId) || new Set<string>();
  const newAchievements: Achievement[] = [];

  achievements.forEach((achievement) => {
    if (earned.has(achievement.id)) return;

    if (
      achievement.type === "streak" &&
      currentStreak >= achievement.requirement
    ) {
      earned.add(achievement.id);
      newAchievements.push(achievement);
    }

    if (
      achievement.type === "completion" &&
      totalCompletions >= achievement.requirement
    ) {
      earned.add(achievement.id);
      newAchievements.push(achievement);
    }

    if (
      achievement.type === "milestone" &&
      achievement.id === "first_checkin" &&
      totalCompletions === 1
    ) {
      earned.add(achievement.id);
      newAchievements.push(achievement);
    }
  });

  earnedAchievements.value.set(habitId, earned);
  return newAchievements;
};

export const getEarnedAchievements = (habitId: number) => {
  const earned = earnedAchievements.value.get(habitId) || new Set<string>();
  return achievements.filter((a) => earned.has(a.id));
};

export const getTotalPoints = (habitId: number) => {
  const earned = getEarnedAchievements(habitId);
  return earned.reduce((total, achievement) => total + achievement.points, 0);
};
