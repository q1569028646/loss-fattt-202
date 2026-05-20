import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, GOAL_LABELS } from '../../utils/constants';
import { useProfileStore } from '../../stores/profileStore';
import type { WeightGoal } from '../../types';

const GOAL_OPTIONS: { goal: WeightGoal; icon: string; desc: string }[] = [
  { goal: 'lose', icon: '📉', desc: '减少体脂，塑造线条' },
  { goal: 'maintain', icon: '⚖️', desc: '保持当前体重和体型' },
  { goal: 'gain', icon: '💪', desc: '增加肌肉和体重' },
];

export default function Step7Screen() {
  const router = useRouter();
  const { profile, setWeightGoal } = useProfileStore();

  return (
    <View style={styles.container}>
      <Text style={styles.step}>7 / 10</Text>
      <Text style={styles.title}>你的目标是？</Text>
      <Text style={styles.subtitle}>我们将据此调整热量摄入</Text>

      <View style={styles.options}>
        {GOAL_OPTIONS.map(({ goal, icon, desc }) => (
          <TouchableOpacity
            key={goal}
            style={[styles.option, profile.weightGoal === goal && styles.optionSelected]}
            onPress={() => setWeightGoal(goal)}
          >
            <Text style={styles.optionIcon}>{icon}</Text>
            <View style={styles.optionText}>
              <Text style={[styles.optionLabel, profile.weightGoal === goal && styles.optionLabelSelected]}>
                {GOAL_LABELS[goal]}
              </Text>
              <Text style={styles.optionDesc}>{desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => router.push('/onboarding/step8')}
      >
        <Text style={styles.nextText}>下一步</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 80,
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
    marginBottom: 40,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionIcon: {
    fontSize: 36,
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: COLORS.primaryDark,
  },
  optionDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
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
