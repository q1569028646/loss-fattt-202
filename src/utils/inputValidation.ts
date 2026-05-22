/**
 * 输入验证工具
 * 用于验证用户输入的数据是否在合理范围内
 */

// 验证规则常量
export const VALIDATION_RULES = {
  age: { min: 10, max: 120, default: 25 },
  height: { min: 50, max: 300, default: 170 },
  weight: { min: 20, max: 500, default: 70 },
  goalWeight: { min: 20, max: 500, default: 70 },
  servingSize: { min: 1, max: 5000, default: 100 },
  calories: { min: 0, max: 50000, default: 0 },
  protein: { min: 0, max: 5000, default: 0 },
  carbs: { min: 0, max: 5000, default: 0 },
  fat: { min: 0, max: 5000, default: 0 },
  fiber: { min: 0, max: 1000, default: 0 },
  sugar: { min: 0, max: 2000, default: 0 },
  sodium: { min: 0, max: 50000, default: 0 },
  exerciseKcal: { min: 0, max: 10000, default: 0 },
} as const;

// 验证结果类型
export interface ValidationResult {
  isValid: boolean;
  value: number;
  error?: string;
}

/**
 * 验证年龄输入
 */
export function validateAge(value: unknown): ValidationResult {
  return validateNumber(value, '年龄', VALIDATION_RULES.age.min, VALIDATION_RULES.age.max, VALIDATION_RULES.age.default);
}

/**
 * 验证身高输入（厘米）
 */
export function validateHeight(value: unknown): ValidationResult {
  return validateNumber(value, '身高', VALIDATION_RULES.height.min, VALIDATION_RULES.height.max, VALIDATION_RULES.height.default);
}

/**
 * 验证体重输入（千克）
 */
export function validateWeight(value: unknown): ValidationResult {
  return validateNumber(value, '体重', VALIDATION_RULES.weight.min, VALIDATION_RULES.weight.max, VALIDATION_RULES.weight.default);
}

/**
 * 验证目标体重输入（千克）
 */
export function validateGoalWeight(value: unknown): ValidationResult {
  return validateNumber(value, '目标体重', VALIDATION_RULES.goalWeight.min, VALIDATION_RULES.goalWeight.max, VALIDATION_RULES.goalWeight.default);
}

/**
 * 验证份量输入（克）
 */
export function validateServingSize(value: unknown): ValidationResult {
  return validateNumber(value, '份量', VALIDATION_RULES.servingSize.min, VALIDATION_RULES.servingSize.max, VALIDATION_RULES.servingSize.default);
}

/**
 * 通用数值验证函数
 */
export function validateNumber(
  value: unknown,
  fieldName: string,
  min: number,
  max: number,
  defaultValue: number
): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  
  if (isNaN(num)) {
    return { isValid: false, value: defaultValue, error: `请输入有效的${fieldName}` };
  }
  if (num < min) {
    return { isValid: false, value: min, error: `${fieldName}不能小于${min}` };
  }
  if (num > max) {
    return { isValid: false, value: max, error: `${fieldName}不能大于${max}` };
  }
  
  return { isValid: true, value: num };
}

/**
 * 验证卡路里输入
 */
export function validateCalories(value: unknown): ValidationResult {
  return validateNumber(value, '卡路里', VALIDATION_RULES.calories.min, VALIDATION_RULES.calories.max, VALIDATION_RULES.calories.default);
}

/**
 * 验证蛋白质输入
 */
export function validateProtein(value: unknown): ValidationResult {
  return validateNumber(value, '蛋白质', VALIDATION_RULES.protein.min, VALIDATION_RULES.protein.max, VALIDATION_RULES.protein.default);
}

/**
 * 验证碳水化合物输入
 */
export function validateCarbs(value: unknown): ValidationResult {
  return validateNumber(value, '碳水化合物', VALIDATION_RULES.carbs.min, VALIDATION_RULES.carbs.max, VALIDATION_RULES.carbs.default);
}

/**
 * 验证脂肪输入
 */
export function validateFat(value: unknown): ValidationResult {
  return validateNumber(value, '脂肪', VALIDATION_RULES.fat.min, VALIDATION_RULES.fat.max, VALIDATION_RULES.fat.default);
}

/**
 * 验证运动消耗卡路里
 */
export function validateExerciseKcal(value: unknown): ValidationResult {
  return validateNumber(value, '运动消耗', VALIDATION_RULES.exerciseKcal.min, VALIDATION_RULES.exerciseKcal.max, VALIDATION_RULES.exerciseKcal.default);
}
