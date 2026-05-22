export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type Gender = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type WeightGoal = 'lose' | 'maintain' | 'gain';

export interface Nutrients {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  cholesterol_mg: number;
  potassium_mg: number;
  vitamin_a_mcg: number;
  vitamin_c_mg: number;
  calcium_mg: number;
  iron_mg: number;
}

export interface FoodAnalysisResult {
  food_name: string;
  serving_size_grams: number;
  serving_description: string;
  nutrients: Nutrients;
  confidence: number;
  notes: string;
  error?: string;
}

export interface MultiFoodAnalysisResult {
  items: FoodAnalysisResult[];
  total_estimate: {
    calories_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  error?: string;
}

export interface UserProfile {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  goalWeightKg: number;
  activityLevel: ActivityLevel;
  weightGoal: WeightGoal;
  tdee: number;
  calorieAdjustment: number;
  proteinG: number;
  isOnboarded: boolean;
}

export interface FoodEntry {
  id: string;
  name: string;
  mealType: MealType;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  imageUri?: string;
  aiProviderId: string;
  rawAiResponse: string;
  isFavorite: boolean;
  createdAt: number;
  deletedAt?: number;
}

export interface WeightEntry {
  id: string;
  weightKg: number;
  bodyFatPercent?: number;
  createdAt: number;
}

export type ExerciseType = 'running' | 'walking' | 'swimming' | 'cycling' | 'fitness' | 'yoga' | 'hiit' | 'ball' | 'other';

export interface ExerciseEntry {
  id: string;
  type: ExerciseType;
  durationMin: number;
  calories: number;
  note?: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
}

export interface DayRecord {
  date: string;
  exerciseKcal: number;
}

export interface NutritionLabelResult {
  energy_kj: number;
  energy_kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  cholesterol_mg: number;
  saturated_fat_g: number;
  trans_fat_g: number;
  serving_label: string;
  serving_base_grams: number;
  product_name: string;
  error?: string;
}
