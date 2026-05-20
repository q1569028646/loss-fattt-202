/**
 * 餐食模板状态管理
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '../utils/dateUtils';
import type { MealType } from '../types';

export interface MealTemplateItem {
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealTemplate {
  id: string;
  name: string;
  mealType: MealType;
  items: MealTemplateItem[];
  totalCalories: number;
  createdAt: number;
}

const TEMPLATE_KEY = 'nutriflow_meal_templates';

interface TemplateState {
  templates: MealTemplate[];
  loading: boolean;
  initialize: () => Promise<void>;
  saveTemplate: (name: string, mealType: MealType, items: MealTemplateItem[]) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  getByType: (mealType: MealType) => MealTemplate[];
}

async function load(): Promise<MealTemplate[]> {
  try {
    const raw = await AsyncStorage.getItem(TEMPLATE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function save(templates: MealTemplate[]): Promise<void> {
  try {
    await AsyncStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('Failed to save templates:', e);
  }
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  loading: false,

  initialize: async () => {
    set({ loading: true });
    const templates = await load();
    set({ templates, loading: false });
  },

  saveTemplate: async (name, mealType, items) => {
    const totalCalories = items.reduce((sum, i) => sum + i.calories, 0);
    const template: MealTemplate = {
      id: generateId('template'),
      name,
      mealType,
      items,
      totalCalories,
      createdAt: Date.now(),
    };
    const templates = [...get().templates, template];
    await save(templates);
    set({ templates });
  },

  deleteTemplate: async (id) => {
    const templates = get().templates.filter(t => t.id !== id);
    await save(templates);
    set({ templates });
  },

  getByType: (mealType) => {
    return get().templates.filter(t => t.mealType === mealType);
  },
}));
