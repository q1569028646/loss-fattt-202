import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../utils/constants';
import { MonthlyRating } from './MonthlyRating';
import { GoalPrediction } from './GoalPrediction';
import { DietPatternAlert } from './DietPatternAlert';
import type { FoodEntry } from '../../types';

interface SmartAnalysisProps {
  allEntries: FoodEntry[];
  todayKey: string;
  dailyCalories: number;
  proteinTarget: number;
  weightHistory: { date: string; weight: number }[];
  goalWeight: number;
  achievementProgress: { unlocked: number; total: number };
  onOpenAchievements: () => void;
}

export function SmartAnalysis({
  allEntries,
  todayKey,
  dailyCalories,
  proteinTarget,
  weightHistory,
  goalWeight,
  achievementProgress,
  onOpenAchievements,
}: SmartAnalysisProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🧠 智能分析</Text>

      <View style={styles.section}>
        <MonthlyRating allEntries={allEntries} dailyTarget={dailyCalories} />
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <GoalPrediction weightHistory={weightHistory} goalWeight={goalWeight} />
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <DietPatternAlert
          allEntries={allEntries}
          todayKey={todayKey}
          proteinTarget={proteinTarget}
          dailyCalories={dailyCalories}
        />
      </View>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.achievementRow} onPress={onOpenAchievements}>
        <Text style={styles.achievementTitle}>🏅 成就</Text>
        <Text style={styles.achievementCount}>
          {achievementProgress.unlocked}/{achievementProgress.total} 已解锁
        </Text>
        <Text style={styles.achievementArrow}>查看全部 &gt;</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  section: {
    marginVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 10,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  achievementCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  achievementArrow: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 'auto',
  },
});
