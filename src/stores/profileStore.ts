import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile, Gender, ActivityLevel, WeightGoal, WeightEntry } from '../types';
import { calculateBMR, calculateTDEE, calculateCalorieAdjustment, calculateProteinTarget } from '../services/nutrition';
import { getItemAsync, setItemAsync } from '../utils/storage';

const PROFILE_KEY = 'user_profile';
const WEIGHT_KEY = 'nutriflow_weight_entries';

const DEFAULT_PROFILE: UserProfile = {
  gender: 'male',
  age: 25,
  heightCm: 170,
  weightKg: 70,
  goalWeightKg: 65,
  activityLevel: 'moderate',
  weightGoal: 'lose',
  tdee: 0,
  calorieAdjustment: 0,
  proteinG: 0,
  isOnboarded: false,
};

function recalculateTargets(profile: Omit<UserProfile, 'tdee' | 'calorieAdjustment' | 'proteinG'>): UserProfile {
  const bmr = calculateBMR(profile.gender, profile.weightKg, profile.heightCm, profile.age);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const calorieAdjustment = calculateCalorieAdjustment(profile.weightGoal);
  const proteinG = calculateProteinTarget(profile.weightKg, profile.weightGoal);
  return { ...profile, tdee, calorieAdjustment, proteinG };
}

interface ProfileState {
  profile: UserProfile;
  weightEntries: WeightEntry[];
  initialized: boolean;
  initialize: () => Promise<void>;
  setGender: (gender: Gender) => void;
  setAge: (age: number) => void;
  setHeight: (heightCm: number) => void;
  setWeight: (weightKg: number) => void;
  setGoalWeight: (goalWeightKg: number) => void;
  setActivityLevel: (level: ActivityLevel) => void;
  setWeightGoal: (goal: WeightGoal) => void;
  completeOnboarding: () => Promise<void>;
  updateWeight: (weightKg: number) => void;
  addWeightEntry: (weightKg: number, bodyFatPercent?: number) => Promise<void>;
  deleteWeightEntry: (id: string) => Promise<void>;
  getLatestWeight: () => number;
}

async function loadWeightEntries(): Promise<WeightEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(WEIGHT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveWeightEntries(entries: WeightEntry[]): Promise<void> {
  await AsyncStorage.setItem(WEIGHT_KEY, JSON.stringify(entries));
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: DEFAULT_PROFILE,
  weightEntries: [],
  initialized: false,

  initialize: async () => {
    try {
      const [savedProfile, weightData] = await Promise.all([
        getItemAsync(PROFILE_KEY),
        loadWeightEntries(),
      ]);
      const profile = savedProfile
        ? JSON.parse(savedProfile) as UserProfile
        : recalculateTargets(DEFAULT_PROFILE);
      set({ profile, weightEntries: weightData, initialized: true });
    } catch {
      const profile = recalculateTargets(DEFAULT_PROFILE);
      set({ profile, weightEntries: [], initialized: true });
    }
  },

  setGender: (gender) => {
    const updated = recalculateTargets({ ...get().profile, gender });
    set({ profile: updated });
    setItemAsync(PROFILE_KEY, JSON.stringify(updated));
  },

  setAge: (age) => {
    const updated = recalculateTargets({ ...get().profile, age });
    set({ profile: updated });
    setItemAsync(PROFILE_KEY, JSON.stringify(updated));
  },

  setHeight: (heightCm) => {
    const updated = recalculateTargets({ ...get().profile, heightCm });
    set({ profile: updated });
    setItemAsync(PROFILE_KEY, JSON.stringify(updated));
  },

  setWeight: (weightKg) => {
    const updated = recalculateTargets({ ...get().profile, weightKg });
    set({ profile: updated });
    setItemAsync(PROFILE_KEY, JSON.stringify(updated));
  },

  setGoalWeight: (goalWeightKg) => {
    const updated = recalculateTargets({ ...get().profile, goalWeightKg });
    set({ profile: updated });
    setItemAsync(PROFILE_KEY, JSON.stringify(updated));
  },

  setActivityLevel: (activityLevel) => {
    const updated = recalculateTargets({ ...get().profile, activityLevel });
    set({ profile: updated });
    setItemAsync(PROFILE_KEY, JSON.stringify(updated));
  },

  setWeightGoal: (weightGoal) => {
    const updated = recalculateTargets({ ...get().profile, weightGoal });
    set({ profile: updated });
    setItemAsync(PROFILE_KEY, JSON.stringify(updated));
  },

  completeOnboarding: async () => {
    const updated = { ...get().profile, isOnboarded: true };
    await setItemAsync(PROFILE_KEY, JSON.stringify(updated));
    set({ profile: updated });
  },

  updateWeight: (weightKg) => {
    const updated = recalculateTargets({ ...get().profile, weightKg });
    set({ profile: updated });
    setItemAsync(PROFILE_KEY, JSON.stringify(updated));
  },

  addWeightEntry: async (weightKg, bodyFatPercent) => {
    const entry: WeightEntry = {
      id: `weight_${Date.now()}`,
      weightKg,
      bodyFatPercent,
      createdAt: Date.now(),
    };
    const entries = [...get().weightEntries, entry];
    await saveWeightEntries(entries);
    const updated = recalculateTargets({ ...get().profile, weightKg });
    set({ weightEntries: entries, profile: updated });
    setItemAsync(PROFILE_KEY, JSON.stringify(updated));
  },

  deleteWeightEntry: async (id) => {
    const entries = get().weightEntries.filter(e => e.id !== id);
    await saveWeightEntries(entries);
    set({ weightEntries: entries });
  },

  getLatestWeight: () => {
    const entries = get().weightEntries;
    if (entries.length === 0) return get().profile.weightKg;
    return entries[entries.length - 1].weightKg;
  },
}));
