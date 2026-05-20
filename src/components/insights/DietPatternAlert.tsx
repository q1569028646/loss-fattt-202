import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/constants';
import type { FoodEntry } from '../../types';

interface AlertItem {
  type: 'warning' | 'info';
  message: string;
}

interface DietPatternAlertProps {
  allEntries: FoodEntry[];
  todayKey: string;
  proteinTarget: number;
  dailyCalories: number;
}

function dateToKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function filterByDate(entries: FoodEntry[], dk: string): FoodEntry[] {
  return entries.filter(e => dateToKey(e.createdAt) === dk && !e.deletedAt);
}

function sum(entries: FoodEntry[], field: keyof FoodEntry): number {
  return entries.reduce((s, e) => s + (Number(e[field]) || 0), 0);
}

function analyzeDietPatterns(
  allEntries: FoodEntry[],
  todayKey: string,
  proteinTarget: number,
  dailyCalories: number
): AlertItem[] {
  const alerts: AlertItem[] = [];
  const todayEntries = filterByDate(allEntries, todayKey);
  const totalCal = sum(todayEntries, 'calories');
  const totalProtein = sum(todayEntries, 'protein');
  const totalCarbs = sum(todayEntries, 'carbs');
  const totalFat = sum(todayEntries, 'fat');

  if (totalCal < 300) return alerts;

  const dinnerCal = sum(todayEntries.filter(e => e.mealType === 'dinner'), 'calories');
  const dinnerPct = totalCal > 0 ? dinnerCal / totalCal : 0;
  if (dinnerPct > 0.5) {
    alerts.push({ type: 'warning', message: `晚餐占全天 ${Math.round(dinnerPct * 100)}%，热量集中在晚上不利于代谢` });
  }

  const carbsCal = totalCarbs * 4;
  const fatCal = totalFat * 9;
  const proteinCal = totalProtein * 4;
  const totalMacroCal = carbsCal + fatCal + proteinCal;
  const carbsPct = totalMacroCal > 0 ? carbsCal / totalMacroCal : 0;
  if (carbsPct > 0.65) {
    alerts.push({ type: 'info', message: `碳水占 ${Math.round(carbsPct * 100)}%，试试增加蛋白质比例` });
  }

  if (proteinTarget > 0) {
    const proteinPct = totalProtein / proteinTarget;
    if (proteinPct < 0.8) {
      alerts.push({ type: 'warning', message: `蛋白质只达目标 ${Math.round(proteinPct * 100)}%，多吃蛋奶豆制品` });
    }
  }

  let overStreak = 0;
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dk = dateToKey(d.getTime());
    const dayEntries = filterByDate(allEntries, dk);
    const cal = sum(dayEntries, 'calories');
    if (cal > dailyCalories && cal > 300) {
      overStreak++;
    } else {
      break;
    }
  }
  if (overStreak >= 3) {
    alerts.push({ type: 'warning', message: `连续 ${overStreak} 天超目标热量，注意控制` });
  }

  const foodCounts: Record<string, number> = {};
  todayEntries.forEach(e => { foodCounts[e.name] = (foodCounts[e.name] || 0) + 1; });
  for (const [name, count] of Object.entries(foodCounts)) {
    if (count >= 3) {
      alerts.push({ type: 'info', message: `今天吃了 ${count} 次${name}，换点花样营养更均衡` });
    }
  }

  return alerts;
}

export function DietPatternAlert({ allEntries, todayKey, proteinTarget, dailyCalories }: DietPatternAlertProps) {
  const alerts = useMemo(
    () => analyzeDietPatterns(allEntries, todayKey, proteinTarget, dailyCalories),
    [allEntries, todayKey, proteinTarget, dailyCalories]
  );

  if (alerts.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚠️ 饮食洞察 ({alerts.length}项)</Text>
      {alerts.map((alert, i) => (
        <View key={i} style={[styles.alertRow, alert.type === 'warning' ? styles.alertWarning : styles.alertInfo]}>
          <Text style={styles.alertIcon}>{alert.type === 'warning' ? '⚠️' : 'ℹ️'}</Text>
          <Text style={styles.alertMessage}>{alert.message}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  alertWarning: {
    backgroundColor: '#FFF3E0',
  },
  alertInfo: {
    backgroundColor: '#E3F2FD',
  },
  alertIcon: {
    fontSize: 16,
  },
  alertMessage: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
});
