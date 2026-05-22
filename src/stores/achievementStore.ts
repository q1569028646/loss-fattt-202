import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFoodStore } from './foodStore';
import { useProfileStore } from './profileStore';
import { calcStreak, countDaysInPeriod, calcProteinStreak, calcDeficitStreak } from '../utils/streakCalc';

const STORAGE_KEY = 'nutriflow_achievements';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
}

const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
  { id: 'streak_7', name: '坚持就是胜利', description: '连续记录7天', icon: '🔥' },
  { id: 'monthly_20', name: '月度达人', description: '30天内记录≥20天', icon: '🎯' },
  { id: 'weight_1kg', name: '初见成效', description: '体重下降≥1kg', icon: '⚖️' },
  { id: 'protein_7', name: '蛋白质达人', description: '连续7天蛋白质达标', icon: '🥗' },
  { id: 'first_photo', name: '第一顿饭', description: '首次拍照记录', icon: '📸' },
  { id: 'deficit_7', name: '热量掌控', description: '连续7天保持热量缺口', icon: '💪' },
  { id: 'records_100', name: '百次记录', description: '累计记录≥100次', icon: '🏆' },
];

function buildInitial(): Achievement[] {
  return ACHIEVEMENT_DEFS.map(d => ({ ...d, unlocked: false, progress: 0 }));
}

interface AchievementState {
  achievements: Achievement[];
  loaded: boolean;
  loadAchievements: () => Promise<void>;
  checkAndUnlock: () => Promise<void>;
  getProgress: () => { unlocked: number; total: number };
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  achievements: buildInitial(),
  loaded: false,

  loadAchievements: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: Achievement[] = JSON.parse(raw);
        const merged = buildInitial().map(def => {
          const s = saved.find(a => a.id === def.id);
          return s ? { ...def, unlocked: s.unlocked, unlockedAt: s.unlockedAt, progress: s.progress } : def;
        });
        set({ achievements: merged, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  checkAndUnlock: async () => {
    const { allEntries } = useFoodStore.getState();
    const { profile, weightEntries } = useProfileStore.getState();
    const now = Date.now();
    const today = new Date();
    let updated = false;

    const newAchievements = get().achievements.map(ach => {
      if (ach.unlocked) return ach;

      let newProgress = 0;
      let shouldUnlock = false;

      switch (ach.id) {
        case 'streak_7': {
          const streak = calcStreak(allEntries);
          newProgress = Math.min(streak / 7, 1);
          shouldUnlock = streak >= 7;
          break;
        }
        case 'monthly_20': {
          const days = countDaysInPeriod(allEntries, 30);
          newProgress = Math.min(days / 20, 1);
          shouldUnlock = days >= 20;
          break;
        }
        case 'weight_1kg': {
          if (weightEntries.length >= 2) {
            const first = weightEntries[0].weightKg;
            const current = weightEntries[weightEntries.length - 1].weightKg;
            const loss = first - current;
            newProgress = Math.min(Math.max(loss, 0) / 1, 1);
            shouldUnlock = loss >= 1;
          }
          break;
        }
        case 'protein_7': {
          const streak = calcProteinStreak(allEntries, profile.proteinG || 0);
          newProgress = Math.min(streak / 7, 1);
          shouldUnlock = streak >= 7;
          break;
        }
        case 'first_photo': {
          const hasPhoto = allEntries.some(e => e.imageUri && !e.deletedAt);
          newProgress = hasPhoto ? 1 : 0;
          shouldUnlock = hasPhoto;
          break;
        }
        case 'deficit_7': {
          const streak = calcDeficitStreak(allEntries, (profile.tdee + profile.calorieAdjustment) || 2000);
          newProgress = Math.min(streak / 7, 1);
          shouldUnlock = streak >= 7;
          break;
        }
        case 'records_100': {
          const total = allEntries.filter(e => !e.deletedAt).length;
          newProgress = Math.min(total / 100, 1);
          shouldUnlock = total >= 100;
          break;
        }
      }

      if (newProgress !== ach.progress || shouldUnlock !== ach.unlocked) {
        updated = true;
        return {
          ...ach,
          progress: Math.min(newProgress, 1),
          unlocked: shouldUnlock,
          unlockedAt: shouldUnlock && !ach.unlocked ? now : ach.unlockedAt,
        };
      }
      return ach;
    });

    if (updated) {
      set({ achievements: newAchievements });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newAchievements));
    }
  },

  getProgress: () => {
    const { achievements } = get();
    return {
      unlocked: achievements.filter(a => a.unlocked).length,
      total: achievements.length,
    };
  },
}));

