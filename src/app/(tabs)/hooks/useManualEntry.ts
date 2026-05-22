import { useState } from 'react';
import { Alert } from 'react-native';
import { MEAL_LABELS } from '../../../utils/constants';
import { hapticSuccess } from '../../../utils/haptics';
import { useFoodStore } from '../../../stores/foodStore';
import { useAIProviderStore } from '../../../stores/aiProviderStore';
import { addCustomFood } from '../../../data/foods';
import type { CustomFoodInput } from '../../../data/foods';
import type { MealType, FoodAnalysisResult } from '../../../types';
import type { useFoodAnalysis } from './useFoodAnalysis';

interface ManualEntryData {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  servingSize: string;
  servingUnit: string;
}

const DEFAULT_MANUAL_ENTRY: ManualEntryData = {
  name: '', calories: '', protein: '', carbs: '', fat: '', servingSize: '', servingUnit: 'g',
};

interface UseManualEntryParams {
  selectedMeal: MealType;
  foodAnalysis: ReturnType<typeof useFoodAnalysis>;
}

export function useManualEntry({ selectedMeal, foodAnalysis }: UseManualEntryParams) {
  const { addFoodFromAnalysis } = useFoodStore();
  const { activeProviderId } = useAIProviderStore();

  const [manualMode, setManualMode] = useState(false);
  const [manualEntry, setManualEntry] = useState<ManualEntryData>({ ...DEFAULT_MANUAL_ENTRY });
  const [saveToFoodDB, setSaveToFoodDB] = useState(false);

  const handleManualSave = async () => {
    if (!manualEntry.name || !manualEntry.calories) {
      Alert.alert('提示', '请至少填写食物名称和热量');
      return;
    }
    const result: FoodAnalysisResult = {
      food_name: manualEntry.name,
      serving_size_grams: parseFloat(manualEntry.servingSize) || 100,
      serving_description: `${manualEntry.servingSize || 100}${manualEntry.servingUnit}`,
      nutrients: {
        calories_kcal: parseFloat(manualEntry.calories) || 0,
        protein_g: parseFloat(manualEntry.protein) || 0,
        carbs_g: parseFloat(manualEntry.carbs) || 0,
        fat_g: parseFloat(manualEntry.fat) || 0,
        fiber_g: 0, sugar_g: 0, sodium_mg: 0,
        cholesterol_mg: 0, potassium_mg: 0,
        vitamin_a_mcg: 0, vitamin_c_mg: 0,
        calcium_mg: 0, iron_mg: 0,
      },
      confidence: 1.0,
      notes: '手动录入',
    };
    await addFoodFromAnalysis(result, selectedMeal, undefined, 'manual', 1);
    if (saveToFoodDB) {
      const input: CustomFoodInput = {
        name: manualEntry.name,
        category: '主食',
        calories_kcal: Math.round((parseFloat(manualEntry.calories) || 0) / ((parseFloat(manualEntry.servingSize) || 100) / 100)),
        protein_g: Math.round(((parseFloat(manualEntry.protein) || 0) / ((parseFloat(manualEntry.servingSize) || 100) / 100)) * 10) / 10,
        carbs_g: Math.round(((parseFloat(manualEntry.carbs) || 0) / ((parseFloat(manualEntry.servingSize) || 100) / 100)) * 10) / 10,
        fat_g: Math.round(((parseFloat(manualEntry.fat) || 0) / ((parseFloat(manualEntry.servingSize) || 100) / 100)) * 10) / 10,
      };
      await addCustomFood(input);
    }
    hapticSuccess();
    Alert.alert('保存成功', `${manualEntry.name} 已添加到${MEAL_LABELS[selectedMeal]}${saveToFoodDB ? '，并已保存到食物库' : ''}`);
    setManualEntry({ ...DEFAULT_MANUAL_ENTRY });
    setSaveToFoodDB(false);
  };

  const handleSwitchToManual = () => {
    foodAnalysis.resetAnalysis();
    setManualMode(true);
  };

  return {
    manualMode,
    setManualMode,
    manualEntry,
    setManualEntry,
    saveToFoodDB,
    setSaveToFoodDB,
    handleManualSave,
    handleSwitchToManual,
  };
}
