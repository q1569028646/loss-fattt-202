import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../utils/constants';
import { useAIProviderStore } from '../../stores/aiProviderStore';
import { DEFAULT_PROVIDERS } from '../../services/ai/types';

export default function Step8Screen() {
  const router = useRouter();
  const { activeProviderId, setActiveProvider } = useAIProviderStore();

  return (
    <View style={styles.container}>
      <Text style={styles.step}>8 / 10</Text>
      <Text style={styles.title}>选择AI服务商</Text>
      <Text style={styles.subtitle}>用于食物识别和智能教练</Text>

      <View style={styles.options}>
        {DEFAULT_PROVIDERS.map((provider) => (
          <TouchableOpacity
            key={provider.id}
            style={[styles.option, activeProviderId === provider.id && styles.optionSelected]}
            onPress={() => setActiveProvider(provider.id)}
          >
            <View style={styles.optionText}>
              <Text style={[styles.optionLabel, activeProviderId === provider.id && styles.optionLabelSelected]}>
                {provider.name}
              </Text>
              <Text style={styles.optionDesc}>{provider.baseURL}</Text>
            </View>
            {activeProviderId === provider.id && (
              <Text style={styles.check}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => router.push('/onboarding/step9')}
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
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: COLORS.primaryDark,
  },
  optionDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  check: {
    fontSize: 20,
    color: COLORS.primary,
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
