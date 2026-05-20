import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, ACTIVITY_LABELS } from '../../utils/constants';
import { useProfileStore } from '../../stores/profileStore';
import type { ActivityLevel } from '../../types';

const ACTIVITY_OPTIONS: { level: ActivityLevel; icon: string; desc: string }[] = [
  { level: 'sedentary', icon: '🪑', desc: '几乎不运动，办公室工作' },
  { level: 'light', icon: '🚶', desc: '每周1-3次轻度运动' },
  { level: 'moderate', icon: '🏃', desc: '每周3-5次中等强度运动' },
  { level: 'active', icon: '🏋️', desc: '每周6-7次高强度运动' },
  { level: 'very_active', icon: '🏅', desc: '专业运动员或体力劳动' },
];

export default function Step6Screen() {
  const router = useRouter();
  const { profile, setActivityLevel } = useProfileStore();

  return (
    <View style={styles.container}>
      <Text style={styles.step}>6 / 10</Text>
      <Text style={styles.title}>你的活动水平是？</Text>
      <Text style={styles.subtitle}>用于计算每日总消耗</Text>

      <View style={styles.options}>
        {ACTIVITY_OPTIONS.map(({ level, icon, desc }) => (
          <TouchableOpacity
            key={level}
            style={[styles.option, profile.activityLevel === level && styles.optionSelected]}
            onPress={() => setActivityLevel(level)}
          >
            <Text style={styles.optionIcon}>{icon}</Text>
            <View style={styles.optionText}>
              <Text style={[styles.optionLabel, profile.activityLevel === level && styles.optionLabelSelected]}>
                {ACTIVITY_LABELS[level]}
              </Text>
              <Text style={styles.optionDesc}>{desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => router.push('/onboarding/step7')}
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
    marginBottom: 24,
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: COLORS.primaryDark,
  },
  optionDesc: {
    fontSize: 12,
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
