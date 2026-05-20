import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Platform, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, MEAL_LABELS } from '../../utils/constants';
import { hapticSuccess } from '../../utils/haptics';
import { useFoodStore } from '../../stores/foodStore';
import { useAIProviderStore } from '../../stores/aiProviderStore';
import { FoodSearchModal } from '../../components/food/FoodSearchModal';
import { KjKcalConverter } from '../../components/food/KjKcalConverter';
import { NutritionLabelResultCard } from '../../components/food/NutritionLabelResult';
import type { FoodDBItem } from '../../data/foods';
import { addCustomFood } from '../../data/foods';
import type { CustomFoodInput } from '../../data/foods';
import type { MealType, FoodAnalysisResult, MultiFoodAnalysisResult, NutritionLabelResult as NutritionLabelResultType } from '../../types';

function getDefaultMealType(): MealType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 17) return 'snack';
  if (hour >= 17 && hour < 21) return 'dinner';
  return 'snack';
}

export default function AddFoodScreen() {
  const router = useRouter();
  const [selectedMeal, setSelectedMeal] = useState<MealType>(getDefaultMealType);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [multiResult, setMultiResult] = useState<MultiFoodAnalysisResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [analyzeFailed, setAnalyzeFailed] = useState<string | null>(null);
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    name: '', calories: '', protein: '', carbs: '', fat: '', servingSize: '', servingUnit: 'g',
  });
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [saveToFoodDB, setSaveToFoodDB] = useState(false);
  const [ocrResult, setOcrResult] = useState<NutritionLabelResultType | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSaving, setOcrSaving] = useState(false);
  const [ocrFailed, setOcrFailed] = useState<string | null>(null);

  const { addFoodFromAnalysis, addFoodEntry, getFavoriteFoods, getRecentFoods, copyYesterdayMeal } = useFoodStore();
  const { getActiveClient, providers, activeProviderId } = useAIProviderStore();
  const activeProvider = providers.find(p => p.id === activeProviderId);

  const isWeb = Platform.OS === 'web';
  const hasApiKey = !!activeProvider?.apiKey;

  const favoriteFoods = getFavoriteFoods();
  const recentFoods = getRecentFoods(8);

  const resetAnalysis = () => {
    setMultiResult(null);
    setSelectedItems(new Set());
    setExpandedItems(new Set());
    setAnalyzeFailed(null);
    setImagePreviewUri(null);
    setLoading(false);
  };

  const resetOcr = () => {
    setOcrResult(null);
    setOcrLoading(false);
    setOcrFailed(null);
  };

  const analyzeNutritionLabel = async (base64: string) => {
    if (!hasApiKey) {
      setOcrLoading(false);
      Alert.alert(
        '未设置API Key',
        '识别营养标签需要AI服务支持。请在"设置 → AI服务商"中输入您的API Key。',
        [
          { text: '取消', style: 'cancel' },
          { text: '去设置', onPress: () => router.push('/(tabs)/settings') },
        ]
      );
      return;
    }

    try {
      const client = getActiveClient();
      const result = await client.analyzeNutritionLabel(base64);
      if (result.error) {
        setOcrFailed(`识别失败: ${result.error}`);
        setOcrLoading(false);
        return;
      }
      setOcrResult(result);
    } catch (err: any) {
      const msg = err?.message || '未知错误';
      if (msg.includes('fetch')) {
        setOcrFailed(`网络错误: 无法连接到 ${activeProvider?.name}`);
      } else if (msg.includes('401') || msg.includes('403')) {
        setOcrFailed('API Key 无效或已过期');
      } else {
        setOcrFailed(`识别失败: ${msg}`);
      }
    } finally {
      setOcrLoading(false);
    }
  };

  const pickOcrImage = async () => {
    resetOcr();
    setOcrLoading(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        base64: !isWeb,
      });

      if (result.canceled || !result.assets?.[0]) {
        setOcrLoading(false);
        return;
      }

      const asset = result.assets[0];
      let base64: string;
      if (asset.base64) {
        base64 = asset.base64;
      } else if (isWeb && asset.uri) {
        base64 = await toBase64(asset.uri);
      } else {
        setOcrFailed('无法读取图片数据');
        setOcrLoading(false);
        return;
      }

      await analyzeNutritionLabel(base64);
    } catch (err: any) {
      setOcrFailed(`图片选择失败: ${err.message || '未知错误'}`);
      setOcrLoading(false);
    }
  };

  const takeOcrPhoto = async () => {
    if (isWeb) {
      Alert.alert('提示', '浏览器端不支持拍照，请使用"相册选择"上传营养标签图片');
      return;
    }

    resetOcr();
    setOcrLoading(true);

    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('权限不足', '需要相机权限来拍摄营养标签');
        setOcrLoading(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.5,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        setOcrLoading(false);
        return;
      }

      const asset = result.assets[0];
      if (asset.base64) {
        await analyzeNutritionLabel(asset.base64);
        return;
      }

      setOcrFailed('无法读取图片数据');
      setOcrLoading(false);
    } catch (err: any) {
      setOcrFailed(`拍照失败: ${err.message || '未知错误'}`);
      setOcrLoading(false);
    }
  };

  const handleOcrSave = async (labelResult: NutritionLabelResultType, gramsConsumed: number) => {
    if (ocrSaving) return;
    setOcrSaving(true);
    try {
      const ratio = gramsConsumed / (labelResult.serving_base_grams || 100);
      const foodResult: FoodAnalysisResult = {
        food_name: labelResult.product_name || '营养标签录入',
        serving_size_grams: gramsConsumed,
        serving_description: `${gramsConsumed}g`,
        nutrients: {
          calories_kcal: Math.round(labelResult.energy_kcal * ratio),
          protein_g: Math.round(labelResult.protein_g * ratio * 10) / 10,
          carbs_g: Math.round(labelResult.carbs_g * ratio * 10) / 10,
          fat_g: Math.round(labelResult.fat_g * ratio * 10) / 10,
          fiber_g: Math.round(labelResult.fiber_g * ratio * 10) / 10,
          sugar_g: Math.round(labelResult.sugar_g * ratio * 10) / 10,
          sodium_mg: Math.round(labelResult.sodium_mg * ratio),
          cholesterol_mg: Math.round(labelResult.cholesterol_mg * ratio),
          potassium_mg: 0,
          vitamin_a_mcg: 0,
          vitamin_c_mg: 0,
          calcium_mg: 0,
          iron_mg: 0,
        },
        confidence: 1.0,
        notes: `营养标签录入 (${labelResult.serving_label})`,
      };
      await addFoodFromAnalysis(foodResult, selectedMeal, undefined, activeProviderId, 1);
      hapticSuccess();
      Alert.alert('保存成功', `${foodResult.food_name} 已添加到${MEAL_LABELS[selectedMeal]}`);
      resetOcr();
    } catch (err: any) {
      Alert.alert('保存失败', err?.message || '请重试');
    } finally {
      setOcrSaving(false);
    }
  };

  const toBase64 = (uri: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (uri.startsWith('data:')) {
        const base64 = uri.includes('base64,') ? uri.split('base64,')[1] : uri;
        resolve(base64);
        return;
      }
      const reader = new FileReader();
      fetch(uri)
        .then(res => res.blob())
        .then(blob => {
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.includes('base64,') ? result.split('base64,')[1] : result;
            resolve(base64);
          };
          reader.onerror = () => reject(new Error('文件读取失败'));
          reader.readAsDataURL(blob);
        })
        .catch(reject);
    });
  };

  const pickImage = async () => {
    setAnalyzeFailed(null);
    setMultiResult(null);
    setLoading(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.4,
        base64: !isWeb,
      });

      if (result.canceled || !result.assets?.[0]) {
        resetAnalysis();
        return;
      }

      const asset = result.assets[0];
      setImagePreviewUri(asset.uri);

      let base64: string;
      if (asset.base64) {
        base64 = asset.base64;
      } else if (isWeb && asset.uri) {
        base64 = await toBase64(asset.uri);
      } else {
        setAnalyzeFailed('无法读取图片数据，请重试');
        setLoading(false);
        return;
      }

      await analyzeImage(base64);
    } catch (err: any) {
      setAnalyzeFailed(`图片选择失败: ${err.message || '未知错误'}`);
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    if (isWeb) {
      Alert.alert('提示', '浏览器端不支持拍照，请使用"相册选择"上传食物图片，或者用手机App拍照');
      return;
    }

    setAnalyzeFailed(null);
    setMultiResult(null);
    setLoading(true);

    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('权限不足', '需要相机权限来拍照识别食物');
        resetAnalysis();
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.4,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        resetAnalysis();
        return;
      }

      const asset = result.assets[0];
      setImagePreviewUri(asset.uri);

      if (asset.base64) {
        await analyzeImage(asset.base64);
        return;
      }

      setAnalyzeFailed('无法读取图片数据，请重试');
      setLoading(false);
    } catch (err: any) {
      setAnalyzeFailed(`拍照失败: ${err.message || '未知错误'}`);
      setLoading(false);
    }
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

  const handleRetry = async () => {
    if (imagePreviewUri && isWeb) {
      setAnalyzeFailed(null);
      setLoading(true);
      try {
        const base64 = await toBase64(imagePreviewUri);
        await analyzeImage(base64);
      } catch (err: any) {
        setAnalyzeFailed(`重试失败: ${err.message || '未知错误'}`);
        setLoading(false);
      }
    }
  };

  const handleSwitchToManual = () => {
    resetAnalysis();
    setManualMode(true);
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

  const updateItemField = (index: number, field: string, value: string) => {
    if (!multiResult) return;
    const items = [...multiResult.items];
    const item = { ...items[index] };
    const num = parseFloat(value);
    const nutrientFields = ['calories_kcal', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'sodium_mg'];

    if (field === 'food_name') {
      item.food_name = value;
    } else if (field === 'serving_description') {
      item.serving_description = value;
    } else if (field === 'serving_size_grams') {
      item.serving_size_grams = isNaN(num) ? item.serving_size_grams : num;
    } else if (nutrientFields.includes(field)) {
      item.nutrients = { ...item.nutrients, [field]: isNaN(num) ? (item.nutrients as any)[field] : num };
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
    // 使用 Promise.all 并行保存，提高性能
    await Promise.all(
      toSave.map(item => addFoodFromAnalysis(item, selectedMeal, undefined, activeProviderId, 1))
    );
    Alert.alert('保存成功', `${toSave.length} 项食物已添加到${MEAL_LABELS[selectedMeal]}`);
    hapticSuccess();
    resetAnalysis();
    setNote('');
  };

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
    setManualEntry({ name: '', calories: '', protein: '', carbs: '', fat: '', servingSize: '', servingUnit: 'g' });
    setSaveToFoodDB(false);
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

  const meals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  const getConfidenceColor = (c: number) => {
    if (c >= 0.7) return COLORS.primary;
    if (c >= 0.4) return '#FF9800';
    return '#F44336';
  };

  const getConfidenceLabel = (c: number) => {
    if (c >= 0.7) return '较确定';
    if (c >= 0.4) return '不太确定';
    return '不确定';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.titleRow}>
          <Text style={styles.title}>添加食物</Text>
          <TouchableOpacity style={styles.converterBtn} onPress={() => setShowConverter(true)}>
            <Text style={styles.converterBtnIcon}>⚡</Text>
          </TouchableOpacity>
        </View>

        {!hasApiKey && (
          <TouchableOpacity style={styles.apiKeyWarning} onPress={() => router.push('/(tabs)/settings')}>
            <Text style={styles.apiKeyWarningText}>⚠️ 尚未配置API Key，AI拍照识别不可用。点击前往设置 →</Text>
          </TouchableOpacity>
        )}

        {isWeb && (
          <View style={styles.webNotice}>
            <Text style={styles.webNoticeText}>💡 浏览器端请使用"相册选择"上传图片，拍照功能仅在手机App中可用</Text>
          </View>
        )}

        <View style={styles.mealSelector}>
          {meals.map(meal => (
            <TouchableOpacity key={meal} style={[styles.mealChip, selectedMeal === meal && styles.mealChipSelected]} onPress={() => setSelectedMeal(meal)}>
              <Text style={[styles.mealChipText, selectedMeal === meal && styles.mealChipTextSelected]}>{MEAL_LABELS[meal]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.modeToggle}>
          <TouchableOpacity style={[styles.modeButton, !manualMode && styles.modeButtonActive]} onPress={() => setManualMode(false)}>
            <Text style={[styles.modeButtonText, !manualMode && styles.modeButtonTextActive]}>AI识别</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeButton, manualMode && styles.modeButtonActive]} onPress={() => setManualMode(true)}>
            <Text style={[styles.modeButtonText, manualMode && styles.modeButtonTextActive]}>手动录入</Text>
          </TouchableOpacity>
        </View>

        {!manualMode ? (
          <>
            <View style={styles.quickSection}>
              <Text style={styles.quickTitle}>⭐ 收藏</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
                {favoriteFoods.map(food => (
                  <TouchableOpacity key={`fav_${food.id}`} style={styles.quickChip} onPress={() => {
                    const entry: import('../../types').FoodEntry = { ...food, id: `food_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`, mealType: selectedMeal, createdAt: Date.now(), isFavorite: false, deletedAt: undefined };
                    addFoodEntry(entry);
                    Alert.alert('已添加', `${food.name} 已添加到${MEAL_LABELS[selectedMeal]}`);
                  }}>
                    <Text style={styles.quickChipText} numberOfLines={1}>{food.name}</Text>
                    <Text style={styles.quickChipCal}>{food.calories}kcal</Text>
                  </TouchableOpacity>
                ))}
                {favoriteFoods.length === 0 && <Text style={styles.quickEmpty}>在首页点☆收藏食物</Text>}
              </ScrollView>
            </View>

            <View style={styles.quickSection}>
              <Text style={styles.quickTitle}>📋 最近常吃</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
                {recentFoods.map(food => (
                  <TouchableOpacity key={`recent_${food.id}`} style={styles.quickChip} onPress={() => {
                    const entry: import('../../types').FoodEntry = { ...food, id: `food_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`, mealType: selectedMeal, createdAt: Date.now(), isFavorite: false, deletedAt: undefined };
                    addFoodEntry(entry);
                    Alert.alert('已添加', `${food.name} 已添加到${MEAL_LABELS[selectedMeal]}`);
                  }}>
                    <Text style={styles.quickChipText} numberOfLines={1}>{food.name}</Text>
                    <Text style={styles.quickChipCal}>{food.calories}kcal</Text>
                  </TouchableOpacity>
                ))}
                {recentFoods.length === 0 && <Text style={styles.quickEmpty}>最近7天无记录</Text>}
              </ScrollView>
            </View>

            <View style={styles.quickSection}>
              <Text style={styles.quickTitle}>📅 复制昨天</Text>
              <View style={styles.copyRow}>
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(meal => (
                  <TouchableOpacity key={`copy_${meal}`} style={styles.copyBtn} onPress={async () => {
                    await copyYesterdayMeal(meal);
                    Alert.alert('已复制', `昨天的${MEAL_LABELS[meal]}已复制到今天`);
                  }}>
                    <Text style={styles.copyBtnText}>{MEAL_LABELS[meal]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.foodDBButton} onPress={() => setShowFoodSearch(true)}>
              <Text style={styles.foodDBIcon}>📖</Text>
              <Text style={styles.foodDBLabel}>食物库搜索</Text>
              <Text style={styles.foodDBHint}>1657种食材</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cameraButton} onPress={takePhoto} disabled={loading}>
                <Text style={styles.cameraIcon}>📷</Text>
                <Text style={styles.cameraLabel}>{isWeb ? '不支持' : '拍照识别'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cameraButton} onPress={pickImage} disabled={loading}>
                <Text style={styles.cameraIcon}>🖼️</Text>
                <Text style={styles.cameraLabel}>相册选择</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ocrSection}>
              <Text style={styles.ocrSectionTitle}>📋 识别营养标签</Text>
              <Text style={styles.ocrSectionHint}>拍摄食品包装上的营养成分表</Text>
              <View style={styles.ocrButtons}>
                <TouchableOpacity style={styles.ocrButton} onPress={takeOcrPhoto} disabled={ocrLoading}>
                  <Text style={styles.ocrButtonIcon}>📷</Text>
                  <Text style={styles.ocrButtonLabel}>{isWeb ? '不支持' : '拍照'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ocrButton} onPress={pickOcrImage} disabled={ocrLoading}>
                  <Text style={styles.ocrButtonIcon}>🖼️</Text>
                  <Text style={styles.ocrButtonLabel}>相册</Text>
                </TouchableOpacity>
              </View>
            </View>

            {ocrLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 16 }} />
                <Text style={styles.loadingText}>📋 正在识别营养标签...</Text>
                <Text style={styles.loadingSubtext}>正在读取营养成分表数据</Text>
                <Text style={styles.loadingHint}>这可能需要 3-10 秒</Text>
              </View>
            )}

            {ocrFailed && !ocrLoading && (
              <View style={styles.failedCard}>
                <Text style={styles.failedTitle}>⚠️ 识别失败</Text>
                <Text style={styles.failedMessage}>{ocrFailed}</Text>
                <Text style={styles.failedHint}>请确认图片是清晰的营养成分表后重新尝试</Text>
                <View style={styles.failedActions}>
                  <TouchableOpacity style={styles.retryButton} onPress={resetOcr}><Text style={styles.retryButtonText}>🔄 重新选择图片</Text></TouchableOpacity>
                </View>
              </View>
            )}

            {ocrResult && !ocrLoading && (
              <NutritionLabelResultCard
                result={ocrResult}
                mealType={selectedMeal}
                saving={ocrSaving}
                onSave={handleOcrSave}
                onCancel={resetOcr}
              />
            )}

            <TextInput style={styles.noteInput} value={note} onChangeText={setNote} placeholder="添加备注（可选，帮助AI更准确识别）" placeholderTextColor="#BDBDBD" multiline />

            {loading && (
              <View style={styles.loadingContainer}>
                {imagePreviewUri && <Image source={{ uri: imagePreviewUri }} style={styles.previewImage} resizeMode="cover" />}
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 16 }} />
                <Text style={styles.loadingText}>🤖 AI 正在识别中...</Text>
                <Text style={styles.loadingSubtext}>正在将图片发送到 {activeProvider?.name || 'AI'} 进行分析</Text>
                <Text style={styles.loadingHint}>这可能需要 3-10 秒</Text>
              </View>
            )}

            {analyzeFailed && !loading && (
              <View style={styles.failedCard}>
                <Text style={styles.failedTitle}>⚠️ 识别失败</Text>
                <Text style={styles.failedMessage}>{analyzeFailed}</Text>
                <Text style={styles.failedHint}>请确认照片中是清晰的菜品后重试，或手动录入</Text>
                <View style={styles.failedActions}>
                  <TouchableOpacity style={styles.retryButton} onPress={handleRetry}><Text style={styles.retryButtonText}>🔄 重试</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.switchManualButton} onPress={handleSwitchToManual}><Text style={styles.switchManualButtonText}>📝 手动录入</Text></TouchableOpacity>
                </View>
              </View>
            )}

            {multiResult && !loading && (
              <View style={styles.multiResultContainer}>
                <View style={styles.multiResultHeader}>
                  <Text style={styles.multiResultTitle}>🔍 识别结果</Text>
                  <Text style={styles.multiResultCount}>共 {multiResult.items.length} 项</Text>
                </View>

                {multiResult.items.map((item, index) => {
                  const isSelected = selectedItems.has(index);
                  const isExpanded = expandedItems.has(index);
                  const confColor = getConfidenceColor(item.confidence);
                  const isLowConf = item.confidence < 0.6;

                  return (
                    <View key={`item_${index}`} style={[styles.foodItemCard, isLowConf && styles.foodItemCardWarn, !isSelected && styles.foodItemCardDisabled]}>
                      <View style={styles.foodItemTop}>
                        <TouchableOpacity style={styles.checkbox} onPress={() => toggleSelect(index)}>
                          <View style={[styles.checkboxInner, isSelected && styles.checkboxChecked]}>
                            {isSelected && <Text style={styles.checkboxTick}>✓</Text>}
                          </View>
                        </TouchableOpacity>
                        <View style={styles.foodItemInfo}>
                          <TextInput style={styles.foodItemName} value={item.food_name} onChangeText={v => updateItemField(index, 'food_name', v)} />
                          <Text style={styles.foodItemServing}>{item.serving_description} · {Math.round(item.nutrients.calories_kcal)} kcal</Text>
                        </View>
                        <View style={[styles.confBadge, { backgroundColor: confColor + '20' }]}>
                          <Text style={[styles.confText, { color: confColor }]}>{getConfidenceLabel(item.confidence)}</Text>
                        </View>
                        <TouchableOpacity style={styles.expandBtn} onPress={() => toggleExpand(index)}>
                          <Text style={styles.expandBtnText}>{isExpanded ? '▲' : '▼'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.removeItemBtn} onPress={() => removeItem(index)}>
                          <Text style={styles.removeItemText}>✕</Text>
                        </TouchableOpacity>
                      </View>

                      {isLowConf && (
                        <View style={styles.warnBanner}>
                          <Text style={styles.warnText}>⚠️ AI不太确定，请检查名称和营养数据</Text>
                        </View>
                      )}

                      {isExpanded && (
                        <View style={styles.expandedContent}>
                          <View style={styles.editRow}>
                            <Text style={styles.editLabel}>份量说明</Text>
                            <TextInput style={styles.editInput} value={item.serving_description} onChangeText={v => updateItemField(index, 'serving_description', v)} />
                          </View>
                          <View style={styles.editRow}>
                            <Text style={styles.editLabel}>份量(克)</Text>
                            <TextInput style={styles.editInput} value={String(item.serving_size_grams)} onChangeText={v => updateItemField(index, 'serving_size_grams', v)} keyboardType="decimal-pad" />
                          </View>
                          <View style={styles.nutrientGrid}>
                            <View style={styles.nutrientItem}>
                              <Text style={styles.nutrientLabel}>热量</Text>
                              <TextInput style={styles.nutrientInput} value={String(Math.round(item.nutrients.calories_kcal))} onChangeText={v => updateItemField(index, 'calories_kcal', v)} keyboardType="decimal-pad" />
                              <Text style={styles.nutrientUnit}>kcal</Text>
                            </View>
                            <View style={styles.nutrientItem}>
                              <Text style={[styles.nutrientLabel, { color: COLORS.protein }]}>蛋白质</Text>
                              <TextInput style={styles.nutrientInput} value={String(Math.round(item.nutrients.protein_g * 10) / 10)} onChangeText={v => updateItemField(index, 'protein_g', v)} keyboardType="decimal-pad" />
                              <Text style={styles.nutrientUnit}>g</Text>
                            </View>
                            <View style={styles.nutrientItem}>
                              <Text style={[styles.nutrientLabel, { color: COLORS.carbs }]}>碳水</Text>
                              <TextInput style={styles.nutrientInput} value={String(Math.round(item.nutrients.carbs_g * 10) / 10)} onChangeText={v => updateItemField(index, 'carbs_g', v)} keyboardType="decimal-pad" />
                              <Text style={styles.nutrientUnit}>g</Text>
                            </View>
                            <View style={styles.nutrientItem}>
                              <Text style={[styles.nutrientLabel, { color: COLORS.fat }]}>脂肪</Text>
                              <TextInput style={styles.nutrientInput} value={String(Math.round(item.nutrients.fat_g * 10) / 10)} onChangeText={v => updateItemField(index, 'fat_g', v)} keyboardType="decimal-pad" />
                              <Text style={styles.nutrientUnit}>g</Text>
                            </View>
                          </View>
                          {item.notes && <Text style={styles.itemNotes}>💡 {item.notes}</Text>}
                        </View>
                      )}
                    </View>
                  );
                })}

                {selectedSummary && (
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>📊 勾选汇总</Text>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{Math.round(selectedSummary.cal)}</Text>
                        <Text style={styles.summaryUnit}>kcal</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: COLORS.protein }]}>{Math.round(selectedSummary.pro * 10) / 10}</Text>
                        <Text style={styles.summaryUnit}>蛋白质g</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: COLORS.carbs }]}>{Math.round(selectedSummary.carb * 10) / 10}</Text>
                        <Text style={styles.summaryUnit}>碳水g</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: COLORS.fat }]}>{Math.round(selectedSummary.fat * 10) / 10}</Text>
                        <Text style={styles.summaryUnit}>脂肪g</Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.batchSaveRow}>
                  <TouchableOpacity style={styles.cancelResultButton} onPress={resetAnalysis}>
                    <Text style={styles.cancelResultText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.batchSaveButton} onPress={handleBatchSave}>
                    <Text style={styles.batchSaveText}>保存 {selectedItems.size} 项到{MEAL_LABELS[selectedMeal]}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.manualForm}>
            <TextInput style={styles.manualInput} value={manualEntry.name} onChangeText={text => setManualEntry(prev => ({ ...prev, name: text }))} placeholder="食物名称" placeholderTextColor="#BDBDBD" />
            <View style={styles.manualRow}>
              <TextInput style={[styles.manualInput, styles.manualInputHalf]} value={manualEntry.servingSize} onChangeText={text => setManualEntry(prev => ({ ...prev, servingSize: text }))} placeholder="份量" placeholderTextColor="#BDBDBD" keyboardType="decimal-pad" />
              <TextInput style={[styles.manualInput, styles.manualInputHalf]} value={manualEntry.servingUnit} onChangeText={text => setManualEntry(prev => ({ ...prev, servingUnit: text }))} placeholder="单位" placeholderTextColor="#BDBDBD" />
            </View>
            <TextInput style={styles.manualInput} value={manualEntry.calories} onChangeText={text => setManualEntry(prev => ({ ...prev, calories: text }))} placeholder="热量 (kcal)" placeholderTextColor="#BDBDBD" keyboardType="decimal-pad" />
            <View style={styles.manualRow}>
              <TextInput style={[styles.manualInput, styles.manualInputThird]} value={manualEntry.protein} onChangeText={text => setManualEntry(prev => ({ ...prev, protein: text }))} placeholder="蛋白质g" placeholderTextColor="#BDBDBD" keyboardType="decimal-pad" />
              <TextInput style={[styles.manualInput, styles.manualInputThird]} value={manualEntry.carbs} onChangeText={text => setManualEntry(prev => ({ ...prev, carbs: text }))} placeholder="碳水g" placeholderTextColor="#BDBDBD" keyboardType="decimal-pad" />
              <TextInput style={[styles.manualInput, styles.manualInputThird]} value={manualEntry.fat} onChangeText={text => setManualEntry(prev => ({ ...prev, fat: text }))} placeholder="脂肪g" placeholderTextColor="#BDBDBD" keyboardType="decimal-pad" />
            </View>
            <TouchableOpacity style={styles.foodDBCheckRow} onPress={() => setSaveToFoodDB(!saveToFoodDB)}>
              <View style={[styles.foodDBCheckbox, saveToFoodDB && styles.foodDBCheckboxActive]}>
                {saveToFoodDB && <Text style={styles.foodDBCheckboxTick}>✓</Text>}
              </View>
              <Text style={styles.foodDBCheckLabel}>同时保存到食物库</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveFullButton} onPress={handleManualSave}>
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <FoodSearchModal visible={showFoodSearch} onClose={() => setShowFoodSearch(false)} onSelect={handleFoodDBSelect} selectedMeal={selectedMeal} />
      <KjKcalConverter visible={showConverter} onClose={() => setShowConverter(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  converterBtn: { padding: 8, backgroundColor: '#FFF8E1', borderRadius: 10 },
  converterBtnIcon: { fontSize: 20 },
  apiKeyWarning: { backgroundColor: '#FFF3E0', borderRadius: 10, padding: 12, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: COLORS.accent },
  apiKeyWarningText: { fontSize: 13, color: '#E65100', fontWeight: '500' },
  webNotice: { backgroundColor: '#E3F2FD', borderRadius: 10, padding: 10, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: COLORS.protein },
  webNoticeText: { fontSize: 12, color: '#1565C0' },
  mealSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  mealChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0' },
  mealChipSelected: { backgroundColor: COLORS.primary },
  mealChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  mealChipTextSelected: { color: '#FFFFFF' },
  modeToggle: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 10, padding: 3, marginBottom: 20 },
  modeButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  modeButtonActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  modeButtonText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  modeButtonTextActive: { color: COLORS.text, fontWeight: '600' },
  quickSection: { marginBottom: 12 },
  quickTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  quickScroll: { flexDirection: 'row' },
  quickChip: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8, minWidth: 80, maxWidth: 120, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
  quickChipText: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  quickChipCal: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  quickEmpty: { fontSize: 12, color: '#BDBDBD', fontStyle: 'italic' },
  copyRow: { flexDirection: 'row', gap: 8 },
  copyBtn: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.primaryLight },
  copyBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  foodDBButton: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: COLORS.primaryLight },
  foodDBIcon: { fontSize: 24, marginRight: 10 },
  foodDBLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  foodDBHint: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 8 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 8 },
  ocrSection: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#E3F2FD', borderStyle: 'dashed' },
  ocrSectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  ocrSectionHint: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
  ocrButtons: { flexDirection: 'row', gap: 10 },
  ocrButton: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, alignItems: 'center' },
  ocrButtonIcon: { fontSize: 24, marginBottom: 4 },
  ocrButtonLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  actionButtons: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  cameraButton: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 2, borderColor: '#E8F5E9', borderStyle: 'dashed' },
  cameraIcon: { fontSize: 36, marginBottom: 8 },
  cameraLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  noteInput: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, fontSize: 14, color: COLORS.text, minHeight: 60, textAlignVertical: 'top', marginBottom: 16 },
  loadingContainer: { alignItems: 'center', paddingVertical: 20 },
  previewImage: { width: 200, height: 200, borderRadius: 16, marginBottom: 12, borderWidth: 2, borderColor: COLORS.primaryLight },
  loadingText: { fontSize: 18, color: COLORS.primary, fontWeight: '600', marginTop: 4 },
  loadingSubtext: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  loadingHint: { fontSize: 11, color: '#BDBDBD', marginTop: 8 },
  failedCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#FFCDD2' },
  failedTitle: { fontSize: 18, fontWeight: '700', color: COLORS.error, marginBottom: 8 },
  failedMessage: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  failedActions: { flexDirection: 'row', gap: 12 },
  failedHint: { fontSize: 12, color: '#BDBDBD', textAlign: 'center', marginBottom: 16, marginTop: -8 },
  retryButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  switchManualButton: { backgroundColor: '#FFEBEE', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: '#FFCDD2' },
  switchManualButtonText: { color: COLORS.error, fontSize: 14, fontWeight: '600' },

  multiResultContainer: { marginTop: 8 },
  multiResultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  multiResultTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  multiResultCount: { fontSize: 13, color: COLORS.textSecondary },

  foodItemCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
  foodItemCardWarn: { borderColor: '#FFB74D', borderWidth: 1.5 },
  foodItemCardDisabled: { opacity: 0.45 },
  foodItemTop: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { padding: 4, marginRight: 6 },
  checkboxInner: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxTick: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  foodItemInfo: { flex: 1 },
  foodItemName: { fontSize: 16, fontWeight: '600', color: COLORS.text, paddingVertical: 2 },
  foodItemServing: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  confBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 6 },
  confText: { fontSize: 11, fontWeight: '600' },
  expandBtn: { padding: 6, marginLeft: 4 },
  expandBtnText: { fontSize: 12, color: COLORS.textSecondary },
  removeItemBtn: { padding: 6, marginLeft: 2 },
  removeItemText: { fontSize: 13, color: '#BDBDBD' },
  warnBanner: { backgroundColor: '#FFF8E1', borderRadius: 8, padding: 8, marginTop: 8 },
  warnText: { fontSize: 12, color: '#F57F17' },
  expandedContent: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  editLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', width: 70 },
  editInput: { flex: 1, fontSize: 14, color: COLORS.text, backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  nutrientGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 4 },
  nutrientItem: { width: '48%', backgroundColor: '#FAFAFA', borderRadius: 8, padding: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  nutrientLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, width: 36 },
  nutrientInput: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.text, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingVertical: 2, textAlign: 'center' },
  nutrientUnit: { fontSize: 10, color: COLORS.textSecondary, marginLeft: 3 },
  itemNotes: { fontSize: 12, color: COLORS.textSecondary, backgroundColor: '#FFF8E1', padding: 8, borderRadius: 6, marginTop: 4 },

  summaryCard: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, marginTop: 4, marginBottom: 12 },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  summaryUnit: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },

  batchSaveRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelResultButton: { backgroundColor: '#F5F5F5', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center' },
  cancelResultText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500' },
  batchSaveButton: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  batchSaveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  saveFullButton: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  foodDBCheckRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  foodDBCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  foodDBCheckboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  foodDBCheckboxTick: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  foodDBCheckLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  manualForm: { gap: 12 },
  manualInput: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, fontSize: 14, color: COLORS.text },
  manualRow: { flexDirection: 'row', gap: 10 },
  manualInputHalf: { flex: 1 },
  manualInputThird: { flex: 1 },
});
