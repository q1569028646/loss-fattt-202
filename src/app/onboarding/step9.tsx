import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../utils/constants';
import { useAIProviderStore } from '../../stores/aiProviderStore';

export default function Step9Screen() {
  const router = useRouter();
  const { activeProviderId, providers, setApiKey } = useAIProviderStore();
  const [apiKey, setApiKeyLocal] = useState('');
  const activeProvider = providers.find(p => p.id === activeProviderId);

  const handleSave = async () => {
    if (apiKey.trim()) {
      await setApiKey(activeProviderId, apiKey.trim());
    }
    router.push('/onboarding/step10');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.step}>9 / 10</Text>
      <Text style={styles.title}>输入API Key</Text>
      <Text style={styles.subtitle}>
        {activeProvider ? `为 ${activeProvider.name} 输入你的API密钥` : '输入API密钥'}
      </Text>

      <TextInput
        style={styles.input}
        value={apiKey}
        onChangeText={setApiKeyLocal}
        placeholder="sk-..."
        placeholderTextColor="#BDBDBD"
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
      />
      <Text style={styles.hint}>
        密钥将安全存储在设备中，不会上传到任何服务器
      </Text>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleSave}
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
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F5F5F5',
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    paddingHorizontal: 4,
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
