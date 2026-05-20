import type { Gender, ActivityLevel, WeightGoal } from '../../types';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENTS: Record<WeightGoal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

export function calculateBMR(gender: Gender, weightKg: number, heightCm: number, age: number): number {
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function calculateCalorieAdjustment(goal: WeightGoal): number {
  return GOAL_ADJUSTMENTS[goal];
}

export function calculateProteinTarget(weightKg: number, goal: WeightGoal): number {
  const multiplier = goal === 'lose' ? 1.8 : goal === 'gain' ? 2.0 : 1.6;
  return Math.round(weightKg * multiplier);
}

export function calculateMacroSplit(
  calories: number,
  proteinG: number
): { carbsG: number; fatG: number } {
  const proteinCalories = proteinG * 4;
  const remainingCalories = calories - proteinCalories;
  const fatG = Math.round((remainingCalories * 0.35) / 9);
  const carbsG = Math.round((remainingCalories * 0.65) / 4);
  return { carbsG, fatG };
}

export function predictWeightChange(
  currentWeightKg: number,
  tdee: number,
  calorieAdjustment: number,
  days: number
): number {
  const dailyDeficit = calorieAdjustment;
  const totalDeficit = dailyDeficit * days;
  const weightChangeKg = totalDeficit / 7700;
  return currentWeightKg + weightChangeKg;
}
