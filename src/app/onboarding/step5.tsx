import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../utils/constants';
import { useProfileStore } from '../../stores/profileStore';

export default function Step5Screen() {
  const router = useRouter();
  const { profile, setGoalWeight } = useProfileStore();
  const [goalWeight, setGoalWeightLocal] = useState(String(profile.goalWeightKg));

  return (
    <View style={styles.container}>
      <Text style={styles.step}>5 / 10</Text>
      <Text style={styles.title}>你的目标体重是？</Text>
      <Text style={styles.subtitle}>我们将为你计算每日热量目标</Text>

      <TextInput
        style={styles.input}
        value={goalWeight}
        onChangeText={(text) => {
          setGoalWeightLocal(text);
          const num = parseFloat(text);
          if (!isNaN(num) && num > 0) setGoalWeight(num);
        }}
        keyboardType="decimal-pad"
        placeholder="目标体重 (kg)"
        placeholderTextColor="#BDBDBD"
        maxLength={5}
      />
      <Text style={styles.unit}>kg</Text>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => router.push('/onboarding/step6')}
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
  input: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingVertical: 8,
    textAlign: 'center',
  },
  unit: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
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
