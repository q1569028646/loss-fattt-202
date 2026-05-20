import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../utils/constants';
import { useProfileStore } from '../../stores/profileStore';

export default function Step2Screen() {
  const router = useRouter();
  const { profile, setAge } = useProfileStore();
  const [age, setAgeLocal] = useState(String(profile.age));

  return (
    <View style={styles.container}>
      <Text style={styles.step}>2 / 10</Text>
      <Text style={styles.title}>你的年龄是？</Text>
      <Text style={styles.subtitle}>用于计算基础代谢率</Text>

      <TextInput
        style={styles.input}
        value={age}
        onChangeText={(text) => {
          setAgeLocal(text);
          const num = parseInt(text, 10);
          if (!isNaN(num) && num > 0) setAge(num);
        }}
        keyboardType="number-pad"
        placeholder="年龄"
        placeholderTextColor="#BDBDBD"
        maxLength={3}
      />

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => router.push('/onboarding/step3')}
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
