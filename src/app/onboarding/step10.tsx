import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../utils/constants';
import { useProfileStore } from '../../stores/profileStore';
import { formatCalories, formatGrams } from '../../utils/formatters';

export default function Step10Screen() {
  const router = useRouter();
  const { profile, completeOnboarding } = useProfileStore();

  const dailyCalories = profile.tdee + profile.calorieAdjustment;

  const handleComplete = async () => {
    await completeOnboarding();
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.step}>10 / 10</Text>
      <Text style={styles.title}>🎉 准备就绪！</Text>
      <Text style={styles.subtitle}>这是你的个性化营养方案</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>每日热量目标</Text>
          <Text style={styles.summaryValue}>{formatCalories(dailyCalories)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>蛋白质目标</Text>
          <Text style={styles.summaryValue}>{formatGrams(profile.proteinG)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>基础代谢率</Text>
          <Text style={styles.summaryValue}>{formatCalories(profile.tdee)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>目标体重</Text>
          <Text style={styles.summaryValue}>{profile.goalWeightKg} kg</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleComplete}>
        <Text style={styles.nextText}>开始使用 NutriFlow 🚀</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  step: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  nextButton: {
    position: 'absolute',
    bottom: 48,
    left: 24,
    right: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
