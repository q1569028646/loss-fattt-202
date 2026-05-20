import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, GENDER_LABELS } from '../../utils/constants';
import { useProfileStore } from '../../stores/profileStore';

export default function Step1Screen() {
  const router = useRouter();
  const { profile, setGender } = useProfileStore();

  return (
    <View style={styles.container}>
      <Text style={styles.step}>1 / 10</Text>
      <Text style={styles.title}>你的性别是？</Text>
      <Text style={styles.subtitle}>用于计算基础代谢率</Text>

      <View style={styles.options}>
        {(['male', 'female'] as const).map(gender => (
          <TouchableOpacity
            key={gender}
            style={[styles.option, profile.gender === gender && styles.optionSelected]}
            onPress={() => setGender(gender)}
          >
            <Text style={styles.optionIcon}>{gender === 'male' ? '👨' : '👩'}</Text>
            <Text style={[styles.optionLabel, profile.gender === gender && styles.optionLabelSelected]}>
              {GENDER_LABELS[gender]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => router.push('/onboarding/step2')}
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
    flexDirection: 'row',
    gap: 16,
  },
  option: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: COLORS.primaryDark,
    fontWeight: '700',
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
