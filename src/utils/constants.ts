export const MEAL_LABELS: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};

export const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: '久坐不动',
  light: '轻度活动',
  moderate: '中度活动',
  active: '高强度活动',
  very_active: '极高强度活动',
};

export const GOAL_LABELS: Record<string, string> = {
  lose: '减脂',
  maintain: '维持体重',
  gain: '增肌增重',
};

export const GENDER_LABELS: Record<string, string> = {
  male: '男',
  female: '女',
};

import { lightTheme } from './theme';

export const COLORS = {
  primary: lightTheme.primary,
  primaryDark: lightTheme.primaryDark,
  primaryLight: lightTheme.primaryLight,
  accent: lightTheme.accent,
  background: lightTheme.background,
  surface: lightTheme.surface,
  text: lightTheme.text,
  textSecondary: lightTheme.textSecondary,
  error: lightTheme.error,
  protein: lightTheme.protein,
  carbs: lightTheme.carbs,
  fat: lightTheme.fat,
  fiber: lightTheme.fiber,
  mealBreakfast: '#FFB74D',
  mealLunch: '#64B5F6',
  mealDinner: '#81C784',
  mealSnack: '#BA68C8',
};
