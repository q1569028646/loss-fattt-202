import type { UserProfile, FoodEntry } from '../../../types';

export const buildCoachSystemPrompt = (profile: UserProfile, recentLogs: FoodEntry[]) => {
  // 只计算今日汇总，减少token
  const todayTotal = recentLogs.reduce((acc, log) => ({
    calories: acc.calories + (log.calories || 0),
    protein: acc.protein + (log.protein || 0),
    carbs: acc.carbs + (log.carbs || 0),
    fat: acc.fat + (log.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return `你是专业营养教练，帮助用户达成健康目标。

用户信息：
- 性别：${profile.gender === 'male' ? '男' : '女'}，${profile.age}岁
- 身高${profile.heightCm}cm，当前${profile.weightKg}kg，目标${profile.goalWeightKg}kg
- 活动水平：${profile.activityLevel}
- 每日目标：${profile.tdee + profile.calorieAdjustment}kcal，蛋白质${profile.proteinG}g

今日摄入：
- 热量：${Math.round(todayTotal.calories)}kcal
- 蛋白质：${Math.round(todayTotal.protein * 10) / 10}g
- 碳水：${Math.round(todayTotal.carbs * 10) / 10}g
- 脂肪：${Math.round(todayTotal.fat * 10) / 10}g

要求：
1. 简洁实用，用中文回答
2. 可用中餐建议（如：清蒸代替红烧）
3. 不推荐极端节食`;
};
