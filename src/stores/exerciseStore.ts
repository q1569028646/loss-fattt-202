/**
 * 运动记录状态管理
 * 管理运动类型、时长和热量消耗
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayKey, generateId } from '../utils/dateUtils';

export type ExerciseType = 'running' | 'walking' | 'swimming' | 'cycling' | 'fitness' | 'yoga' | 'hiit' | 'ball' | 'other';

export const EXERCISE_TYPES: Record<ExerciseType, { label: string; emoji: string; kcalPer30min: number }> = {
  running: { label: '跑步', emoji: '🏃', kcalPer30min: 300 },
  walking: { label: '快走', emoji: '🚶', kcalPer30min: 150 },
  swimming: { label: '游泳', emoji: '🏊', kcalPer30min: 250 },
  cycling: { label: '骑行', emoji: '🚴', kcalPer30min: 200 },
  fitness: { label: '健身', emoji: '🏋️', kcalPer30min: 250 },
  yoga: { label: '瑜伽', emoji: '🧘', kcalPer30min: 120 },
  hiit: { label: 'HIIT', emoji: '💪', kcalPer30min: 350 },
  ball: { label: '球类', emoji: '⚽', kcalPer30min: 280 },
  other: { label: '其他', emoji: '🎯', kcalPer30min: 180 },
};

export interface ExerciseEntry {
  id: string;
  type: ExerciseType;
  durationMin: number;
  calories: number;
  note?: string;
  createdAt: number;
}

const EXERCISE_KEY = 'nutriflow_exercise_entries';

interface ExerciseState {
  entries: ExerciseEntry[];
  loading: boolean;
  initialize: () => Promise<void>;
  addExercise: (type: ExerciseType, durationMin: number, note?: string) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  getTodayEntries: () => ExerciseEntry[];
  getTotalByDate: (dateKey: string) => { calories: number; durationMin: number };
  getExerciseTotal: (dateKey: string) => number;
}

async function loadEntries(): Promise<ExerciseEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(EXERCISE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load exercise entries:', e);
    return [];
  }
}

async function saveEntries(entries: ExerciseEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(EXERCISE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save exercise entries:', e);
  }
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  entries: [],
  loading: false,

  initialize: async () => {
    set({ loading: true });
    const entries = await loadEntries();
    set({ entries, loading: false });
  },

  addExercise: async (type, durationMin, note) => {
    const kcalRate = EXERCISE_TYPES[type].kcalPer30min;
    const calories = Math.round(kcalRate * (durationMin / 30));
    const entry: ExerciseEntry = {
      id: generateId('exercise'),
      type,
      durationMin,
      calories,
      note,
      createdAt: Date.now(),
    };
    const entries = [...get().entries, entry];
    await saveEntries(entries);
    set({ entries });
  },

  deleteExercise: async (id) => {
    const entries = get().entries.filter(e => e.id !== id);
    await saveEntries(entries);
    set({ entries });
  },

  getTodayEntries: () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return get().entries.filter(e => e.createdAt >= todayStart.getTime());
  },

  getTotalByDate: (dateKey) => {
    const [y, m, d] = dateKey.split('-').map(Number);
    const start = new Date(y, m - 1, d, 0, 0, 0).getTime();
    const end = new Date(y, m - 1, d, 23, 59, 59).getTime();
    const dayEntries = get().entries.filter(e => e.createdAt >= start && e.createdAt <= end);
    return {
      calories: dayEntries.reduce((sum, e) => sum + e.calories, 0),
      durationMin: dayEntries.reduce((sum, e) => sum + e.durationMin, 0),
    };
  },

  getExerciseTotal: (dateKey) => {
    const [y, m, d] = dateKey.split('-').map(Number);
    const start = new Date(y, m - 1, d, 0, 0, 0).getTime();
    const end = new Date(y, m - 1, d, 23, 59, 59).getTime();
    return get().entries
      .filter(e => e.createdAt >= start && e.createdAt <= end)
      .reduce((sum, e) => sum + e.calories, 0);
  },
}));
