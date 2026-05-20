import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../utils/constants';
import { useProfileStore } from '../../stores/profileStore';

export default function Step3Screen() {
  const router = useRouter();
  const { profile, setHeight } = useProfileStore();
  const [height, setHeightLocal] = useState(String(profile.heightCm));

  return (
    <View style={styles.container}>
      <Text style={styles.step}>3 / 10</Text>
      <Text style={styles.title}>你的身高是？</Text>
      <Text style={styles.subtitle}>单位：厘米 (cm)</Text>

      <TextInput
        style={styles.input}
        value={height}
        onChangeText={(text) => {
          setHeightLocal(text);
          const num = parseInt(text, 10);
          if (!isNaN(num) && num > 0) setHeight(num);
        }}
        keyboardType="number-pad"
        placeholder="身高 (cm)"
        placeholderTextColor="#BDBDBD"
        maxLength={3}
      />
      <Text style={styles.unit}>cm</Text>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => router.push('/onboarding/step4')}
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
