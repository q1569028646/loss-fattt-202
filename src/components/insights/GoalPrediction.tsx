import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/constants';

interface GoalPredictionProps {
  weightHistory: { date: string; weight: number }[];
  goalWeight: number;
}

function predictGoalDate(
  weightHistory: { date: string; weight: number }[],
  goalWeight: number
) {
  const recent = weightHistory
    .filter(w => {
      const daysAgo = (Date.now() - new Date(w.date).getTime()) / 86400000;
      return daysAgo >= 0 && daysAgo <= 14;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (recent.length < 5) return { prediction: 'insufficient_data' as const, need: 5 - recent.length };

  const currentWeight = recent[recent.length - 1].weight;

  if (currentWeight <= goalWeight) return { prediction: 'achieved' as const, currentWeight };

  const n = recent.length;
  const xMean = (n - 1) / 2;
  const yMean = recent.reduce((s, w) => s + w.weight, 0) / n;
  let num = 0, den = 0;
  recent.forEach((w, i) => {
    num += (i - xMean) * (w.weight - yMean);
    den += (i - xMean) ** 2;
  });
  const slope = den !== 0 ? num / den : 0;

  if (slope >= 0) {
    const weeklyChange = Math.round(slope * 7 * 100) / 100;
    return { prediction: 'wrong_direction' as const, weeklyChange, currentWeight };
  }

  const daysToGoal = Math.round((goalWeight - currentWeight) / slope);
  const targetDate = new Date(Date.now() + daysToGoal * 86400000);
  const weeklyChange = Math.round(Math.abs(slope) * 7 * 100) / 100;

  return {
    prediction: 'on_track' as const,
    daysToGoal: Math.max(1, daysToGoal),
    date: `${targetDate.getMonth() + 1}月${targetDate.getDate()}日`,
    weeklyChange,
    currentWeight,
  };
}

export function GoalPrediction({ weightHistory, goalWeight }: GoalPredictionProps) {
  const result = useMemo(() => predictGoalDate(weightHistory, goalWeight), [weightHistory, goalWeight]);

  if (!goalWeight || goalWeight <= 0) return null;

  if (result.prediction === 'insufficient_data') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📈 达标预测</Text>
        <Text style={styles.hint}>再记录 {result.need} 天体重就能查看预测</Text>
      </View>
    );
  }

  if (result.prediction === 'achieved') {
    return (
      <View style={styles.container}>
        <Text style={styles.achieved}>🎉 已达成目标体重 {goalWeight}kg！</Text>
        <Text style={styles.hint}>继续加油保持！</Text>
      </View>
    );
  }

  if (result.prediction === 'wrong_direction') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📈 达标预测</Text>
        <Text style={styles.warning}>
          近14天体重 ↑{result.weeklyChange}kg/周，需要调整饮食
        </Text>
        <Text style={styles.detail}>当前 {result.currentWeight}kg → 目标 {goalWeight}kg</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📈 达标预测</Text>
      <Text style={styles.main}>
        按当前趋势，预计 <Text style={styles.highlight}>{result.daysToGoal}</Text> 天后 ({result.date}) 达到目标 {goalWeight}kg
      </Text>
      <Text style={styles.detail}>↓{result.weeklyChange}kg/周</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  main: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
  },
  highlight: {
    fontWeight: '700',
    color: COLORS.primary,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: '#BDBDBD',
  },
  warning: {
    fontSize: 13,
    color: '#FF9800',
    fontWeight: '600',
  },
  detail: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  achieved: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
