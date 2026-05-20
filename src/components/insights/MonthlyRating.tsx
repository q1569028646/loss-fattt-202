import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/constants';
import type { FoodEntry } from '../../types';

interface MonthlyRatingProps {
  allEntries: FoodEntry[];
  dailyTarget: number;
}

function dateToKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const GRADE_COLORS: Record<string, string> = {
  S: '#FFD700',
  A: '#4CAF50',
  B: '#2196F3',
  C: '#FF9800',
  D: '#F44336',
};

function getMonthlyRating(allEntries: FoodEntry[], dailyTarget: number) {
  const now = new Date();
  let totalDays = 0;
  let onTargetDays = 0;

  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dk = dateToKey(d.getTime());
    const dayEntries = allEntries.filter(e => dateToKey(e.createdAt) === dk && !e.deletedAt);
    if (dayEntries.length === 0) continue;
    totalDays++;
    const cal = dayEntries.reduce((s, e) => s + (e.calories || 0), 0);
    if (cal <= dailyTarget) onTargetDays++;
  }

  const rate = totalDays > 0 ? onTargetDays / totalDays : 0;
  let grade: string = 'D';
  if (rate >= 0.9) grade = 'S';
  else if (rate >= 0.75) grade = 'A';
  else if (rate >= 0.5) grade = 'B';
  else if (rate >= 0.25) grade = 'C';

  return { grade, rate, days: totalDays };
}

export function MonthlyRating({ allEntries, dailyTarget }: MonthlyRatingProps) {
  const { grade, rate, days } = useMemo(
    () => getMonthlyRating(allEntries, dailyTarget),
    [allEntries, dailyTarget]
  );

  if (days === 0) return null;

  const color = GRADE_COLORS[grade] || '#BDBDBD';

  return (
    <View style={styles.row}>
      <View style={[styles.gradeCircle, { borderColor: color }]}>
        <Text style={[styles.gradeLetter, { color }]}>{grade}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>🏆 本月评级</Text>
        <Text style={styles.subtitle}>近30天 {Math.round(rate * 100)}% 天数达标</Text>
        <Text style={styles.detail}>记录天数: {days}天</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  gradeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeLetter: {
    fontSize: 24,
    fontWeight: '800',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  detail: {
    fontSize: 11,
    color: '#BDBDBD',
    marginTop: 2,
  },
});
