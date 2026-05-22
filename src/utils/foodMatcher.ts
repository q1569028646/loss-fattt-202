import { FOOD_DB, type FoodDBItem, loadCustomFoods } from '../data/foods';
import type { FoodAnalysisResult, Nutrients } from '../types';

const COOKING_METHODS = [
  '水煮', '红烧', '清蒸', '干煸', '爆炒', '清炒', '小炒', '葱烧', '酱烧',
  '糖醋', '鱼香', '麻辣', '酸辣', '蒜蓉', '葱油', '椒盐', '孜然',
  '凉拌', '热拌', '干锅', '火锅', '冒菜', '香煎', '油焖', '白灼',
  '干炸', '软炸', '清炖', '红焖', '黄焖', '酱焖',
  '炖', '煮', '炒', '煎', '炸', '蒸', '烤', '焖', '煲', '卤', '酱', '拌', '焯',
  '爆', '溜', '扒', '烩', '熬',
];

export function stripCookingMethod(name: string): string {
  const trimmed = name.trim();
  for (const method of COOKING_METHODS) {
    if (trimmed.startsWith(method)) {
      const stripped = trimmed.slice(method.length).trim();
      if (stripped.length > 0) return stripped;
    }
  }
  return trimmed;
}

function getLongestCommonSubstring(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  const m = s1.length;
  const n = s2.length;
  let maxLen = 0;

  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        curr[j] = prev[j - 1] + 1;
        if (curr[j] > maxLen) {
          maxLen = curr[j];
        }
      } else {
        curr[j] = 0;
      }
    }
    const temp = prev;
    prev = curr;
    curr = temp;
    curr.fill(0);
  }

  return maxLen;
}

function getLCSSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  const lcsLen = getLongestCommonSubstring(s1, s2);
  if (lcsLen === 0) return 0;

  const minLen = Math.min(s1.length, s2.length);
  return lcsLen / minLen;
}

function matchFoodInList(foodName: string, foods: FoodDBItem[]): FoodDBItem | null {
  const strippedName = stripCookingMethod(foodName);

  let bestMatch: FoodDBItem | null = null;
  let highestScore = 0;

  for (const food of foods) {
    const strippedFoodName = stripCookingMethod(food.name);

    const nameScoreRaw = getLCSSimilarity(foodName, food.name);
    const nameScoreStripped = getLCSSimilarity(strippedName, strippedFoodName);
    const nameScore = Math.max(nameScoreRaw, nameScoreStripped);

    let aliasScore = 0;
    for (const alias of food.aliases) {
      const strippedAlias = stripCookingMethod(alias);
      const aliasScoreRaw = getLCSSimilarity(foodName, alias);
      const aliasScoreStripped = getLCSSimilarity(strippedName, strippedAlias);
      const score = Math.max(aliasScoreRaw, aliasScoreStripped);
      if (score > aliasScore) aliasScore = score;
    }

    const finalScore = Math.max(nameScore, aliasScore);

    if (finalScore > highestScore) {
      highestScore = finalScore;
      bestMatch = food;
    }
  }

  return highestScore >= 0.5 ? bestMatch : null;
}

export function matchFoodInDB(foodName: string): FoodDBItem | null {
  return matchFoodInList(foodName, FOOD_DB);
}

export async function matchFoodInDBWithCustom(foodName: string): Promise<FoodDBItem | null> {
  const customFoods = await loadCustomFoods();
  const allFoods = [...customFoods, ...FOOD_DB];
  return matchFoodInList(foodName, allFoods);
}

export function calculateNutrientsForGrams(food: FoodDBItem, grams: number): Nutrients {
  const ratio = grams / food.serving_size_grams;
  return {
    calories_kcal: Math.round(food.nutrients.calories_kcal * ratio),
    protein_g: Math.round(food.nutrients.protein_g * ratio * 10) / 10,
    carbs_g: Math.round(food.nutrients.carbs_g * ratio * 10) / 10,
    fat_g: Math.round(food.nutrients.fat_g * ratio * 10) / 10,
    fiber_g: Math.round(food.nutrients.fiber_g * ratio * 10) / 10,
    sugar_g: Math.round(food.nutrients.sugar_g * ratio * 10) / 10,
    sodium_mg: Math.round(food.nutrients.sodium_mg * ratio),
    cholesterol_mg: Math.round(food.cholesterol * ratio),
    potassium_mg: Math.round(food.K * ratio),
    vitamin_a_mcg: Math.round(food.vitaminA * ratio),
    vitamin_c_mg: Math.round(food.vitaminC * ratio),
    calcium_mg: Math.round(food.Ca * ratio),
    iron_mg: Math.round(food.Fe * ratio * 10) / 10,
  };
}

export function estimateNutrients(foodName: string, grams: number): Nutrients {
  let baseCalories = 200;
  let baseProtein = 5;
  let baseCarbs = 20;
  let baseFat = 10;

  const lowerName = foodName.toLowerCase();

  if (lowerName.includes('米饭') || lowerName.includes('面') || lowerName.includes('粉') || lowerName.includes('馒头') || lowerName.includes('饼')) {
    baseCalories = 180;
    baseProtein = 4;
    baseCarbs = 40;
    baseFat = 1;
  } else if (lowerName.includes('肉') || lowerName.includes('鸡') || lowerName.includes('鸭') || lowerName.includes('牛') || lowerName.includes('羊') || lowerName.includes('猪') || lowerName.includes('鱼') || lowerName.includes('虾')) {
    baseCalories = 150;
    baseProtein = 25;
    baseCarbs = 0;
    baseFat = 5;
  } else if (lowerName.includes('蛋')) {
    baseCalories = 150;
    baseProtein = 12;
    baseCarbs = 2;
    baseFat = 11;
  } else if (lowerName.includes('奶') || lowerName.includes('乳')) {
    baseCalories = 60;
    baseProtein = 3;
    baseCarbs = 5;
    baseFat = 3;
  } else if (lowerName.includes('蔬菜') || lowerName.includes('菜') || lowerName.includes('瓜') || lowerName.includes('茄') || lowerName.includes('豆')) {
    baseCalories = 30;
    baseProtein = 2;
    baseCarbs = 6;
    baseFat = 0.2;
  } else if (lowerName.includes('水果')) {
    baseCalories = 50;
    baseProtein = 0.5;
    baseCarbs = 12;
    baseFat = 0.3;
  }

  const ratio = grams / 100;
  return {
    calories_kcal: Math.round(baseCalories * ratio),
    protein_g: Math.round(baseProtein * ratio * 10) / 10,
    carbs_g: Math.round(baseCarbs * ratio * 10) / 10,
    fat_g: Math.round(baseFat * ratio * 10) / 10,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    cholesterol_mg: 0,
    potassium_mg: 0,
    vitamin_a_mcg: 0,
    vitamin_c_mg: 0,
    calcium_mg: 0,
    iron_mg: 0,
  };
}

function enrichFoodAnalysisItemWithMatcher(
  item: FoodAnalysisResult,
  matchFn: (name: string) => FoodDBItem | null
): FoodAnalysisResult {
  const matchedFood = matchFn(item.food_name);
  if (matchedFood) {
    const dbNutrients = calculateNutrientsForGrams(matchedFood, item.serving_size_grams);
    return {
      ...item,
      nutrients: dbNutrients,
      notes: `已匹配食物库: ${matchedFood.name}`,
    };
  }
  return {
    ...item,
    notes: item.notes ? `${item.notes} (食物库未找到)` : `食物库未找到，AI估算`,
  };
}

export function enrichFoodAnalysisItem(item: FoodAnalysisResult): FoodAnalysisResult {
  return enrichFoodAnalysisItemWithMatcher(item, matchFoodInDB);
}

export async function enrichFoodAnalysisItemWithCustom(item: FoodAnalysisResult): Promise<FoodAnalysisResult> {
  const matchedFood = await matchFoodInDBWithCustom(item.food_name);
  return enrichFoodAnalysisItemWithMatcher(item, () => matchedFood);
}

type BasicFoodItem = {
  food_name: string;
  serving_size_grams: number;
  serving_description: string;
  confidence: number;
};

function enrichBasicFoodAnalysisItemWithMatcher(
  item: BasicFoodItem,
  matchFn: (name: string) => FoodDBItem | null
): FoodAnalysisResult {
  const matchedFood = matchFn(item.food_name);
  let nutrients: Nutrients;
  let notes: string;

  if (matchedFood) {
    nutrients = calculateNutrientsForGrams(matchedFood, item.serving_size_grams);
    notes = `已匹配食物库: ${matchedFood.name}`;
  } else {
    nutrients = estimateNutrients(item.food_name, item.serving_size_grams);
    notes = `食物库未找到，AI估算`;
  }

  return {
    food_name: item.food_name,
    serving_size_grams: item.serving_size_grams,
    serving_description: item.serving_description,
    nutrients,
    confidence: item.confidence,
    notes,
  };
}

export function enrichBasicFoodAnalysisItem(item: BasicFoodItem): FoodAnalysisResult {
  return enrichBasicFoodAnalysisItemWithMatcher(item, matchFoodInDB);
}

export async function enrichBasicFoodAnalysisItemWithCustom(item: BasicFoodItem): Promise<FoodAnalysisResult> {
  const matchedFood = await matchFoodInDBWithCustom(item.food_name);
  return enrichBasicFoodAnalysisItemWithMatcher(item, () => matchedFood);
}
