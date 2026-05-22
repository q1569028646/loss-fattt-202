import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MealType, FoodAnalysisResult, FoodEntry, DayRecord } from '../types';
import { 
  todayKey, 
  yesterdayKey, 
  filterEntriesByDate,
  generateId,
  getTimestampDaysAgo
} from '../utils/dateUtils';
import { calcStreak } from '../utils/streakCalc';

const FOOD_KEY = 'nutriflow_food_entries';
const DAY_KEY = 'nutriflow_day_records';

export interface FoodState {
  todayEntries: FoodEntry[];
  allEntries: FoodEntry[];
  dayRecords: DayRecord[];
  selectedDate: string;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  setSelectedDate: (dateKey: string) => void;
  loadEntriesForDate: (dateKey: string) => void;
  addFoodFromAnalysis: (
    result: FoodAnalysisResult,
    mealType: MealType,
    imageUri?: string,
    aiProviderId?: string,
    servingMultiplier?: number
  ) => Promise<void>;
  addFoodEntry: (entry: FoodEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  getSummary: (dateKey?: string) => { calories: number; protein: number; carbs: number; fat: number };
  getFavoriteFoods: () => FoodEntry[];
  getRecentFoods: (limit?: number) => FoodEntry[];
  copyYesterdayMeal: (mealType: MealType) => Promise<void>;
  setExerciseKcal: (dateKey: string, kcal: number) => Promise<void>;
  getExerciseKcal: (dateKey?: string) => number;
  getStreak: () => number;
  getTodayPhotos: () => FoodEntry[];
}

async function loadAllEntries(): Promise<FoodEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(FOOD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to load food entries:', error);
    return [];
  }
}

async function saveAllEntries(entries: FoodEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FOOD_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Failed to save food entries:', error);
    throw error;
  }
}

async function loadDayRecords(): Promise<DayRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(DAY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to load day records:', error);
    return [];
  }
}

async function saveDayRecords(records: DayRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(DAY_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Failed to save day records:', error);
    throw error;
  }
}

export const useFoodStore = create<FoodState>((set, get) => ({
  todayEntries: [],
  allEntries: [],
  dayRecords: [],
  selectedDate: todayKey(),
  loading: false,
  error: null,

  initialize: async () => {
    set({ loading: true });
    try {
      const [all, records] = await Promise.all([loadAllEntries(), loadDayRecords()]);
      const today = filterEntriesByDate(all, todayKey());
      set({ allEntries: all, todayEntries: today, dayRecords: records, loading: false });
    } catch (err) {
      console.error('Failed to initialize food store:', err);
      set({ error: String(err), loading: false });
    }
  },

  setSelectedDate: (dateKey) => {
    set({ selectedDate: dateKey });
    get().loadEntriesForDate(dateKey);
  },

  loadEntriesForDate: (dateKey) => {
    const all = get().allEntries;
    const entries = filterEntriesByDate(all, dateKey);
    set({ todayEntries: entries, selectedDate: dateKey });
  },

  addFoodFromAnalysis: async (result, mealType, imageUri, aiProviderId = 'unknown', servingMultiplier = 1) => {
    set({ loading: true, error: null });
    try {
      const m = servingMultiplier;
      const newEntry: FoodEntry = {
        id: generateId('food'),
        name: result.food_name,
        mealType,
        servingSize: result.serving_size_grams * m,
        servingUnit: result.serving_description,
        calories: Math.round(result.nutrients.calories_kcal * m),
        protein: Math.round(result.nutrients.protein_g * m * 10) / 10,
        carbs: Math.round(result.nutrients.carbs_g * m * 10) / 10,
        fat: Math.round(result.nutrients.fat_g * m * 10) / 10,
        fiber: Math.round(result.nutrients.fiber_g * m * 10) / 10,
        sugar: Math.round(result.nutrients.sugar_g * m * 10) / 10,
        sodium: Math.round(result.nutrients.sodium_mg * m),
        imageUri,
        aiProviderId,
        rawAiResponse: JSON.stringify(result),
        isFavorite: false,
        createdAt: Date.now(),
      };
      const all = [...get().allEntries, newEntry];
      await saveAllEntries(all);
      const entries = filterEntriesByDate(all, get().selectedDate);
      set({ allEntries: all, todayEntries: entries, loading: false });
    } catch (err) {
      console.error('Failed to add food from analysis:', err);
      set({ error: String(err), loading: false });
    }
  },

  addFoodEntry: async (entry) => {
    try {
      const all = [...get().allEntries, entry];
      await saveAllEntries(all);
      const entries = filterEntriesByDate(all, get().selectedDate);
      set({ allEntries: all, todayEntries: entries });
    } catch (err) {
      console.error('Failed to add food entry:', err);
      set({ error: String(err) });
    }
  },

  deleteEntry: async (id) => {
    try {
      const all = get().allEntries.map(e =>
        e.id === id ? { ...e, deletedAt: Date.now() } : e
      );
      await saveAllEntries(all);
      const entries = filterEntriesByDate(all, get().selectedDate);
      set({ allEntries: all, todayEntries: entries });
    } catch (err) {
      console.error('Failed to delete entry:', err);
      set({ error: String(err) });
    }
  },

  toggleFavorite: async (id) => {
    try {
      const all = get().allEntries.map(e =>
        e.id === id ? { ...e, isFavorite: !e.isFavorite } : e
      );
      await saveAllEntries(all);
      const entries = filterEntriesByDate(all, get().selectedDate);
      set({ allEntries: all, todayEntries: entries });
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      set({ error: String(err) });
    }
  },

  getSummary: (dateKey) => {
    const dk = dateKey || get().selectedDate;
    const entries = filterEntriesByDate(get().allEntries, dk);
    return entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + (entry.calories || 0),
        protein: acc.protein + (entry.protein || 0),
        carbs: acc.carbs + (entry.carbs || 0),
        fat: acc.fat + (entry.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  },

  getFavoriteFoods: () => {
    const seen = new Set<string>();
    return get().allEntries
      .filter(e => e.isFavorite && !e.deletedAt)
      .filter(e => {
        const key = `${e.name}_${e.calories}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(-20);
  },

  getRecentFoods: (limit = 10) => {
    const sevenDaysAgo = getTimestampDaysAgo(7);
    const seen = new Set<string>();
    return get().allEntries
      .filter(e => e.createdAt >= sevenDaysAgo && !e.deletedAt)
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter(e => {
        const key = `${e.name}_${e.calories}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit);
  },

  copyYesterdayMeal: async (mealType) => {
    const yk = yesterdayKey();
    const yesterdayEntries = filterEntriesByDate(get().allEntries, yk)
      .filter(e => e.mealType === mealType);
    
    if (yesterdayEntries.length === 0) return;

    const now = Date.now();
    const newEntries = yesterdayEntries.map((e, i) => ({
      ...e,
      id: generateId('food'),
      createdAt: now + i,
      isFavorite: false,
      deletedAt: undefined,
    }));

    const all = [...get().allEntries, ...newEntries];
    await saveAllEntries(all);
    const entries = filterEntriesByDate(all, get().selectedDate);
    set({ allEntries: all, todayEntries: entries });
  },

  setExerciseKcal: async (dateKey, kcal) => {
    try {
      const records = [...get().dayRecords];
      const idx = records.findIndex(r => r.date === dateKey);
      if (idx >= 0) {
        records[idx] = { ...records[idx], exerciseKcal: kcal };
      } else {
        records.push({ date: dateKey, exerciseKcal: kcal });
      }
      await saveDayRecords(records);
      set({ dayRecords: records });
    } catch (err) {
      console.error('Failed to set exercise kcal:', err);
      set({ error: String(err) });
    }
  },

  getExerciseKcal: (dateKey) => {
    const dk = dateKey || get().selectedDate;
    const record = get().dayRecords.find(r => r.date === dk);
    return record?.exerciseKcal || 0;
  },

  getStreak: () => {
    return calcStreak(get().allEntries);
  },

  getTodayPhotos: () => {
    const all = get().allEntries;
    const dk = get().selectedDate || todayKey();
    return filterEntriesByDate(all, dk).filter(e => e.imageUri);
  },
}));
