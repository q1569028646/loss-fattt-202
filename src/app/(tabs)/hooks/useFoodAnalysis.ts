import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MEAL_LABELS } from '../../../utils/constants';
import { hapticSuccess } from '../../../utils/haptics';
import { useFoodStore } from '../../../stores/foodStore';
import { useAIProviderStore } from '../../../stores/aiProviderStore';
import { addCustomFood } from '../../../data/foods';
import type { CustomFoodInput } from '../../../data/foods';
import type { FoodDBItem } from '../../../data/foods';
import type { MealType, MultiFoodAnalysisResult, FoodAnalysisResult } from '../../../types';
import type { useImagePicker } from './useImagePicker';

import { COLORS } from '../../../utils/constants';

export type EditableFoodField = 'food_name' | 'serving_description' | 'serving_size_grams' | 'calories_kcal' | 'protein_g' | 'carbs_g' | 'fat_g' | 'fiber_g' | 'sugar_g' | 'sodium_mg';

export const NUTRIENT_FIELDS: readonly string[] = ['calories_kcal', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'sodium_mg'] as const;

export const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function getConfidenceColor(c: number) {
  if (c >= 0.7) return COLORS.primary;
  if (c >= 0.4) return '#FF9800';
  return '#F44336';
}

export function getConfidenceLabel(c: number) {
  if (c >= 0.7) return '较确定';
  if (c >= 0.4) return '不太确定';
  return '不确定';
}

interface UseFoodAnalysisParams {
  selectedMeal: MealType;
  note: string;
  imagePicker: ReturnType<typeof useImagePicker>;
  onNoteClear?: () => void;
}

export function useFoodAnalysis({ selectedMeal, note, imagePicker, onNoteClear }: UseFoodAnalysisParams) {
  const router = useRouter();
  const { addFoodFromAnalysis } = useFoodStore();
  const { getActiveClient, providers, activeProviderId } = useAIProviderStore();
  const activeProvider = providers.find(p => p.id === activeProviderId);
  const hasApiKey = !!activeProvider?.apiKey;

  const [multiResult, setMultiResult] = useState<MultiFoodAnalysisResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [analyzeFailed, setAnalyzeFailed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetAnalysis = () => {
    setMultiResult(null);
    setSelectedItems(new Set());
    setExpandedItems(new Set());
    setAnalyzeFailed(null);
    imagePicker.setImagePreviewUri(null);
    setLoading(false);
  };

  const analyzeImage = async (base64: string) => {
    if (!hasApiKey) {
      setLoading(false);
      Alert.alert(
        '未设置API Key',
        '拍照识别需要AI服务支持。请在"设置 → AI服务商"中输入您的API Key。\n\n推荐使用硅基流动（cloud.siliconflow.cn），注册即送免费额度。',
        [
          { text: '取消', style: 'cancel' },
          { text: '去设置', onPress: () => router.push('/(tabs)/settings') },
        ]
      );
      return;
    }

    try {
      const client = getActiveClient();
      const result = await client.analyzeFood(base64, note || undefined);
      if (result.error || result.items.length === 0) {
        setAnalyzeFailed(`识别失败: ${result.error || '未识别到食物'}`);
        setLoading(false);
        return;
      }
      setMultiResult(result);
      const allIndices = new Set(result.items.map((_, i) => i));
      setSelectedItems(allIndices);
      setExpandedItems(new Set());
    } catch (err: any) {
      const msg = err?.message || '未知错误';
      if (msg.includes('fetch')) {
        setAnalyzeFailed(`网络错误: 无法连接到 ${activeProvider?.name}。请检查网络连接。`);
      } else if (msg.includes('401') || msg.includes('403')) {
        setAnalyzeFailed('API Key 无效或已过期，请在设置中重新输入。');
      } else if (msg.includes('429')) {
        setAnalyzeFailed('API 请求过于频繁，请稍后重试。');
      } else if (msg.includes('API Key')) {
        setAnalyzeFailed(msg);
      } else {
        setAnalyzeFailed(`分析失败: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    setAnalyzeFailed(null);
    setMultiResult(null);
    setLoading(true);

    try {
      const result = await imagePicker.pickImage();

      if (!result) {
        resetAnalysis();
        return;
      }

      imagePicker.setImagePreviewUri(result.uri);
      await analyzeImage(result.base64);
    } catch (err: any) {
      setAnalyzeFailed(`图片选择失败: ${err.message || '未知错误'}`);
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    if (imagePicker.isWeb) {
      Alert.alert('提示', '浏览器端不支持拍照，请使用"相册选择"上传食物图片，或者用手机App拍照');
      return;
    }

    setAnalyzeFailed(null);
    setMultiResult(null);
    setLoading(true);

    try {
      const result = await imagePicker.takePhoto();

      if (!result) {
        resetAnalysis();
        return;
      }

      imagePicker.setImagePreviewUri(result.uri);
      await analyzeImage(result.base64);
    } catch (err: any) {
      setAnalyzeFailed(`拍照失败: ${err.message || '未知错误'}`);
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (imagePicker.imagePreviewUri && imagePicker.isWeb) {
      setAnalyzeFailed(null);
      setLoading(true);
      try {
        const base64 = await imagePicker.toBase64(imagePicker.imagePreviewUri);
        await analyzeImage(base64);
      } catch (err: any) {
        setAnalyzeFailed(`重试失败: ${err.message || '未知错误'}`);
        setLoading(false);
      }
    }
  };

  const toggleSelect = (index: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const toggleExpand = (index: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const updateItemField = (index: number, field: EditableFoodField, value: string) => {
    if (!multiResult) return;
    const items = [...multiResult.items];
    const item = { ...items[index] };
    const num = parseFloat(value);

    if (field === 'food_name') {
      item.food_name = value;
    } else if (field === 'serving_description') {
      item.serving_description = value;
    } else if (field === 'serving_size_grams') {
      item.serving_size_grams = isNaN(num) ? item.serving_size_grams : num;
    } else if (NUTRIENT_FIELDS.includes(field)) {
      const currentValue = item.nutrients[field as keyof typeof item.nutrients];
      item.nutrients = { ...item.nutrients, [field]: isNaN(num) ? currentValue : num };
    }

    items[index] = item;
    const totalCal = items.reduce((s, it) => s + (it.nutrients.calories_kcal || 0), 0);
    const totalPro = items.reduce((s, it) => s + (it.nutrients.protein_g || 0), 0);
    const totalCarb = items.reduce((s, it) => s + (it.nutrients.carbs_g || 0), 0);
    const totalFat = items.reduce((s, it) => s + (it.nutrients.fat_g || 0), 0);
    setMultiResult({ ...multiResult, items, total_estimate: { calories_kcal: totalCal, protein_g: totalPro, carbs_g: totalCarb, fat_g: totalFat } });
  };

  const removeItem = (index: number) => {
    if (!multiResult) return;
    const items = multiResult.items.filter((_, i) => i !== index);
    if (items.length === 0) {
      resetAnalysis();
      return;
    }
    const newSelected = new Set<number>();
    let newIdx = 0;
    for (let i = 0; i < multiResult.items.length; i++) {
      if (i !== index && selectedItems.has(i)) {
        newSelected.add(newIdx);
        newIdx++;
      } else if (i !== index) {
        newIdx++;
      }
    }
    const totalCal = items.reduce((s, it) => s + (it.nutrients.calories_kcal || 0), 0);
    const totalPro = items.reduce((s, it) => s + (it.nutrients.protein_g || 0), 0);
    const totalCarb = items.reduce((s, it) => s + (it.nutrients.carbs_g || 0), 0);
    const totalFat = items.reduce((s, it) => s + (it.nutrients.fat_g || 0), 0);
    setMultiResult({ ...multiResult, items, total_estimate: { calories_kcal: totalCal, protein_g: totalPro, carbs_g: totalCarb, fat_g: totalFat } });
    setSelectedItems(newSelected);
  };

  const selectedSummary = multiResult
    ? multiResult.items.reduce(
        (acc, item, i) =>
          selectedItems.has(i)
            ? {
                cal: acc.cal + (item.nutrients.calories_kcal || 0),
                pro: acc.pro + (item.nutrients.protein_g || 0),
                carb: acc.carb + (item.nutrients.carbs_g || 0),
                fat: acc.fat + (item.nutrients.fat_g || 0),
              }
            : acc,
        { cal: 0, pro: 0, carb: 0, fat: 0 }
      )
    : null;

  const handleBatchSave = async () => {
    if (!multiResult) return;
    const toSave = multiResult.items.filter((_, i) => selectedItems.has(i));
    if (toSave.length === 0) {
      Alert.alert('提示', '请至少选择一项');
      return;
    }
    await Promise.all(
      toSave.map(item => addFoodFromAnalysis(item, selectedMeal, undefined, activeProviderId, 1))
    );
    Alert.alert('保存成功', `${toSave.length} 项食物已添加到${MEAL_LABELS[selectedMeal]}`);
    hapticSuccess();
    resetAnalysis();
    onNoteClear?.();
  };

  const handleFoodDBSelect = async (food: FoodDBItem, meal: MealType, grams: number) => {
    const ratio = grams / food.serving_size_grams;
    const result: FoodAnalysisResult = {
      food_name: food.name,
      serving_size_grams: grams,
      serving_description: `${Math.round(grams)}g`,
      nutrients: {
        calories_kcal: Math.round(food.nutrients.calories_kcal * ratio),
        protein_g: Math.round(food.nutrients.protein_g * ratio * 10) / 10,
        carbs_g: Math.round(food.nutrients.carbs_g * ratio * 10) / 10,
        fat_g: Math.round(food.nutrients.fat_g * ratio * 10) / 10,
        fiber_g: Math.round(food.nutrients.fiber_g * ratio * 10) / 10,
        sugar_g: Math.round(food.nutrients.sugar_g * ratio * 10) / 10,
        sodium_mg: Math.round(food.nutrients.sodium_mg * ratio),
        cholesterol_mg: 0, potassium_mg: 0,
        vitamin_a_mcg: 0, vitamin_c_mg: 0,
        calcium_mg: 0, iron_mg: 0,
      },
      confidence: 1.0,
      notes: '食物库',
    };
    await addFoodFromAnalysis(result, meal, undefined, 'fooddb', 1);
    Alert.alert('已添加', `${food.name} ${Math.round(grams)}g 已添加到${MEAL_LABELS[meal]}`);
  };

  const handleTextAnalyze = async (text: string): Promise<FoodAnalysisResult[]> => {
    if (!hasApiKey) {
      Alert.alert(
        '未设置API Key',
        '文字识别需要AI服务支持。请在"设置 → AI服务商"中输入您的API Key。',
        [
          { text: '取消', style: 'cancel' },
          { text: '去设置', onPress: () => router.push('/(tabs)/settings') },
        ]
      );
      return [];
    }

    try {
      const client = getActiveClient();
      const result = await client.analyzeTextFood(text);
      if (result.error || result.items.length === 0) {
        Alert.alert('识别失败', result.error || '未识别到食物');
        return [];
      }
      return result.items;
    } catch (err: any) {
      const msg = err?.message || '未知错误';
      if (msg.includes('fetch')) {
        Alert.alert('网络错误', `无法连接到 ${activeProvider?.name}`);
      } else if (msg.includes('401') || msg.includes('403')) {
        Alert.alert('API Key 无效', '请在设置中重新输入');
      } else {
        Alert.alert('识别失败', msg);
      }
      return [];
    }
  };

  const handleTextSave = async (item: FoodAnalysisResult, mealType: MealType, saveToFoods: boolean) => {
    try {
      await addFoodFromAnalysis(item, mealType, undefined, activeProviderId, 1);
      if (saveToFoods) {
        const input: CustomFoodInput = {
          name: item.food_name,
          category: '主食',
          calories_kcal: Math.round((item.nutrients.calories_kcal || 0) / ((item.serving_size_grams || 100) / 100)),
          protein_g: Math.round(((item.nutrients.protein_g || 0) / ((item.serving_size_grams || 100) / 100)) * 10) / 10,
          carbs_g: Math.round(((item.nutrients.carbs_g || 0) / ((item.serving_size_grams || 100) / 100)) * 10) / 10,
          fat_g: Math.round(((item.nutrients.fat_g || 0) / ((item.serving_size_grams || 100) / 100)) * 10) / 10,
        };
        await addCustomFood(input);
      }
      hapticSuccess();
    } catch (err: any) {
      Alert.alert('保存失败', err?.message || '请重试');
    }
  };

  return {
    multiResult,
    selectedItems,
    expandedItems,
    analyzeFailed,
    loading,
    resetAnalysis,
    analyzeImage,
    pickImage,
    takePhoto,
    handleRetry,
    toggleSelect,
    toggleExpand,
    updateItemField,
    removeItem,
    selectedSummary,
    handleBatchSave,
    handleFoodDBSelect,
    handleTextAnalyze,
    handleTextSave,
    activeProvider,
    hasApiKey,
  };
}
