/**
 * 数据导出服务
 * 支持 CSV 和 JSON 格式导出
 */

import type { FoodEntry } from '../../types';
import type { ExerciseEntry } from '../../stores/exerciseStore';

/** 导出食物记录为 CSV */
export function exportFoodCSV(entries: FoodEntry[]): string {
  const header = '日期,食物名称,餐次,份量,热量(kcal),蛋白质(g),碳水(g),脂肪(g),纤维(g),糖(g),钠(mg)\n';
  const rows = entries.map(e => {
    const date = new Date(e.createdAt).toISOString().split('T')[0];
    return [
      date,
      `"${e.name}"`,
      e.mealType,
      `${e.servingSize}${e.servingUnit || 'g'}`,
      e.calories,
      e.protein,
      e.carbs,
      e.fat,
      e.fiber || 0,
      e.sugar || 0,
      e.sodium || 0,
    ].join(',');
  }).join('\n');
  return header + rows;
}

/** 导出食物记录为 JSON */
export function exportFoodJSON(entries: FoodEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

/** 导出运动记录为 CSV */
export function exportExerciseCSV(entries: ExerciseEntry[]): string {
  const header = '日期,运动类型,时长(分钟),消耗热量(kcal),备注\n';
  const rows = entries.map(e => {
    const date = new Date(e.createdAt).toISOString().split('T')[0];
    return [date, e.type, e.durationMin, e.calories, `"${e.note || ''}"`].join(',');
  }).join('\n');
  return header + rows;
}

/** 导出所有数据为 JSON */
export function exportAllJSON(params: {
  foodEntries: FoodEntry[];
  exerciseEntries: ExerciseEntry[];
  exportDate: string;
}): string {
  return JSON.stringify({
    exportDate: params.exportDate,
    foodCount: params.foodEntries.length,
    exerciseCount: params.exerciseEntries.length,
    foodEntries: params.foodEntries,
    exerciseEntries: params.exerciseEntries,
  }, null, 2);
}

/** 获取导出文件名 */
export function getExportFileName(prefix: string, ext: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}_${date}.${ext}`;
}
