import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MEAL_LABELS } from '../../../utils/constants';
import { hapticSuccess } from '../../../utils/haptics';
import { useFoodStore } from '../../../stores/foodStore';
import { useAIProviderStore } from '../../../stores/aiProviderStore';
import type { MealType, FoodAnalysisResult, NutritionLabelResult } from '../../../types';
import type { useImagePicker } from './useImagePicker';

interface UseOCRAnalysisParams {
  selectedMeal: MealType;
  imagePicker: ReturnType<typeof useImagePicker>;
}

export function useOCRAnalysis({ selectedMeal, imagePicker }: UseOCRAnalysisParams) {
  const router = useRouter();
  const { addFoodFromAnalysis } = useFoodStore();
  const { getActiveClient, providers, activeProviderId } = useAIProviderStore();
  const activeProvider = providers.find(p => p.id === activeProviderId);
  const hasApiKey = !!activeProvider?.apiKey;

  const [ocrResult, setOcrResult] = useState<NutritionLabelResult | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSaving, setOcrSaving] = useState(false);
  const [ocrFailed, setOcrFailed] = useState<string | null>(null);

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
      const result = await imagePicker.pickImage(imagePicker.OCR_IMAGE_QUALITY);

      if (!result) {
        setOcrLoading(false);
        return;
      }

      await analyzeNutritionLabel(result.base64);
    } catch (err: any) {
      setOcrFailed(`图片选择失败: ${err.message || '未知错误'}`);
      setOcrLoading(false);
    }
  };

  const takeOcrPhoto = async () => {
    if (imagePicker.isWeb) {
      Alert.alert('提示', '浏览器端不支持拍照，请使用"相册选择"上传营养标签图片');
      return;
    }

    resetOcr();
    setOcrLoading(true);

    try {
      const result = await imagePicker.takePhoto(imagePicker.OCR_IMAGE_QUALITY);

      if (!result) {
        setOcrLoading(false);
        return;
      }

      await analyzeNutritionLabel(result.base64);
    } catch (err: any) {
      setOcrFailed(`拍照失败: ${err.message || '未知错误'}`);
      setOcrLoading(false);
    }
  };

  const handleOcrSave = async (labelResult: NutritionLabelResult, gramsConsumed: number) => {
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

  return {
    ocrResult,
    ocrLoading,
    ocrSaving,
    ocrFailed,
    resetOcr,
    pickOcrImage,
    takeOcrPhoto,
    handleOcrSave,
  };
}
