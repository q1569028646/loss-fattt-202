/**
 * JSON响应验证工具
 * 用于验证AI返回的数据结构是否符合预期
 */

import type { 
  FoodAnalysisResult, 
  MultiFoodAnalysisResult, 
  NutritionLabelResult,
  Nutrients 
} from '../types';

// 验证数值是否在合理范围内
function isValidNumber(value: unknown, min = 0, max = Infinity): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
}

// 转换值为数字（支持字符串数字）
function toNumber(value: unknown, min = 0, max = Infinity, defaultValue = 0): number {
  if (value === null || value === undefined) return defaultValue;
  let num: number;
  if (typeof value === 'string') {
    num = parseFloat(value);
  } else if (typeof value === 'number') {
    num = value;
  } else {
    return defaultValue;
  }
  if (isNaN(num) || num < min || num > max) return defaultValue;
  return num;
}

// 验证字符串
function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

// 验证营养素对象
function validateNutrients(data: unknown): Nutrients {
  const nutrients = data as Record<string, unknown>;
  
  return {
    calories_kcal: isValidNumber(nutrients?.calories_kcal, 0, 50000) ? nutrients.calories_kcal : 0,
    protein_g: isValidNumber(nutrients?.protein_g, 0, 5000) ? nutrients.protein_g : 0,
    carbs_g: isValidNumber(nutrients?.carbs_g, 0, 5000) ? nutrients.carbs_g : 0,
    fat_g: isValidNumber(nutrients?.fat_g, 0, 5000) ? nutrients.fat_g : 0,
    fiber_g: isValidNumber(nutrients?.fiber_g, 0, 1000) ? nutrients.fiber_g : 0,
    sugar_g: isValidNumber(nutrients?.sugar_g, 0, 2000) ? nutrients.sugar_g : 0,
    sodium_mg: isValidNumber(nutrients?.sodium_mg, 0, 50000) ? nutrients.sodium_mg : 0,
    cholesterol_mg: isValidNumber(nutrients?.cholesterol_mg, 0, 10000) ? nutrients.cholesterol_mg : 0,
    potassium_mg: isValidNumber(nutrients?.potassium_mg, 0, 50000) ? nutrients.potassium_mg : 0,
    vitamin_a_mcg: isValidNumber(nutrients?.vitamin_a_mcg, 0, 50000) ? nutrients.vitamin_a_mcg : 0,
    vitamin_c_mg: isValidNumber(nutrients?.vitamin_c_mg, 0, 10000) ? nutrients.vitamin_c_mg : 0,
    calcium_mg: isValidNumber(nutrients?.calcium_mg, 0, 50000) ? nutrients.calcium_mg : 0,
    iron_mg: isValidNumber(nutrients?.iron_mg, 0, 1000) ? nutrients.iron_mg : 0,
  };
}

// 验证单个食物分析结果
export function validateFoodAnalysisResult(data: unknown): FoodAnalysisResult {
  const item = data as Record<string, unknown>;
  
  return {
    food_name: isValidString(item?.food_name) ? item.food_name : '未知食物',
    serving_size_grams: isValidNumber(item?.serving_size_grams, 1, 5000) ? item.serving_size_grams : 100,
    serving_description: isValidString(item?.serving_description) ? item.serving_description : '1份',
    nutrients: validateNutrients(item?.nutrients),
    confidence: isValidNumber(item?.confidence, 0, 1) ? item.confidence : 0.5,
    notes: isValidString(item?.notes) ? item.notes : '',
    error: isValidString(item?.error) ? item.error : undefined,
  };
}

// 验证多食物分析结果
export function validateMultiFoodAnalysisResult(data: unknown): MultiFoodAnalysisResult {
  const parsed = data as Record<string, unknown>;
  
  // 如果有错误字段，直接返回错误
  if (isValidString(parsed?.error)) {
    return {
      items: [],
      total_estimate: { calories_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      error: parsed.error,
    };
  }
  
  // 验证items数组
  let items: FoodAnalysisResult[] = [];
  if (Array.isArray(parsed?.items)) {
    items = parsed.items.map(validateFoodAnalysisResult);
  } else if (parsed?.food_name) {
    // 兼容旧格式：单个食物对象
    items = [validateFoodAnalysisResult(parsed)];
  }
  
  // 验证total_estimate
  const total = parsed?.total_estimate as Record<string, unknown> | undefined;
  const total_estimate = {
    calories_kcal: isValidNumber(total?.calories_kcal, 0, 50000) ? total.calories_kcal : 
                   items.reduce((sum, item) => sum + item.nutrients.calories_kcal, 0),
    protein_g: isValidNumber(total?.protein_g, 0, 5000) ? total.protein_g :
               items.reduce((sum, item) => sum + item.nutrients.protein_g, 0),
    carbs_g: isValidNumber(total?.carbs_g, 0, 5000) ? total.carbs_g :
             items.reduce((sum, item) => sum + item.nutrients.carbs_g, 0),
    fat_g: isValidNumber(total?.fat_g, 0, 5000) ? total.fat_g :
           items.reduce((sum, item) => sum + item.nutrients.fat_g, 0),
  };
  
  return {
    items,
    total_estimate,
  };
}

// 验证营养成分表结果
export function validateNutritionLabelResult(data: unknown): NutritionLabelResult {
  const parsed = data as Record<string, unknown>;
  
  // 如果有错误字段，直接返回错误
  if (isValidString(parsed?.error)) {
    return {
      energy_kj: 0,
      energy_kcal: 0,
      protein_g: 0,
      fat_g: 0,
      carbs_g: 0,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 0,
      cholesterol_mg: 0,
      saturated_fat_g: 0,
      trans_fat_g: 0,
      serving_label: '',
      serving_base_grams: 100,
      product_name: '',
      error: parsed.error,
    };
  }
  
  return {
    energy_kj: toNumber(parsed?.energy_kj, 0, 50000, 0),
    energy_kcal: toNumber(parsed?.energy_kcal, 0, 50000, 0),
    protein_g: toNumber(parsed?.protein_g, 0, 5000, 0),
    fat_g: toNumber(parsed?.fat_g, 0, 5000, 0),
    carbs_g: toNumber(parsed?.carbs_g, 0, 5000, 0),
    fiber_g: toNumber(parsed?.fiber_g, 0, 1000, 0),
    sugar_g: toNumber(parsed?.sugar_g, 0, 2000, 0),
    sodium_mg: toNumber(parsed?.sodium_mg, 0, 50000, 0),
    cholesterol_mg: toNumber(parsed?.cholesterol_mg, 0, 10000, 0),
    saturated_fat_g: toNumber(parsed?.saturated_fat_g, 0, 1000, 0),
    trans_fat_g: toNumber(parsed?.trans_fat_g, 0, 1000, 0),
    serving_label: isValidString(parsed?.serving_label) ? parsed.serving_label : '',
    serving_base_grams: toNumber(parsed?.serving_base_grams, 1, 5000, 100),
    product_name: isValidString(parsed?.product_name) ? parsed.product_name : '',
  };
}

// 安全解析JSON
export function safeJsonParse(jsonString: string): unknown {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    // 尝试从文本中提取JSON
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // 忽略解析错误
      }
    }
    throw new Error('Failed to parse JSON response');
  }
}
