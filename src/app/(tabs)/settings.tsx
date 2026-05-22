import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, GENDER_LABELS, ACTIVITY_LABELS, GOAL_LABELS } from '../../utils/constants';
import { useProfileStore } from '../../stores/profileStore';
import { useAIProviderStore } from '../../stores/aiProviderStore';
import { useChatStore } from '../../stores/chatStore';
import { DEFAULT_PROVIDERS } from '../../services/ai/types';
import { validateAge, validateHeight, validateWeight, validateGoalWeight } from '../../utils/inputValidation';

export default function SettingsScreen() {
  const { profile, setGender, setAge, setHeight, setWeight, setGoalWeight, setActivityLevel, setWeightGoal } = useProfileStore();
  const { activeProviderId, providers, setActiveProvider, setApiKey, setModel } = useAIProviderStore();
  const { clearMessages } = useChatStore();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [visionModelInput, setVisionModelInput] = useState('');
  const [ocrModelInput, setOcrModelInput] = useState('');
  const [chatModelInput, setChatModelInput] = useState('');
  const [showModelConfig, setShowModelConfig] = useState(false);

  const activeProvider = providers.find(p => p.id === activeProviderId);
  const activeDefault = DEFAULT_PROVIDERS.find(p => p.id === activeProviderId);

  const handleSaveApiKey = async () => {
    if (apiKeyInput.trim()) {
      await setApiKey(activeProviderId, apiKeyInput.trim());
      setApiKeyInput('');
      Alert.alert('成功', 'API Key 已保存');
    }
  };

  type ModelType = 'vision' | 'ocr' | 'chat';

  const MODEL_LABELS: Record<ModelType, string> = {
    vision: '视觉模型',
    ocr: 'OCR模型',
    chat: '对话模型',
  };

  const handleSaveModel = (type: ModelType) => async () => {
    const inputMap = { vision: visionModelInput, ocr: ocrModelInput, chat: chatModelInput };
    const input = inputMap[type].trim();
    if (!input) return;
    await setModel(activeProviderId, type, input);
    const setInputMap = { vision: setVisionModelInput, ocr: setOcrModelInput, chat: setChatModelInput };
    setInputMap[type]('');
    Alert.alert('成功', `${MODEL_LABELS[type]}已更新`);
  };

  const handleResetModel = (type: ModelType) => async () => {
    if (!activeDefault) return;
    await setModel(activeProviderId, type, activeDefault.models[type]);
    Alert.alert('成功', `${MODEL_LABELS[type]}已恢复为默认值`);
  };

  const handleClearChat = () => {
    Alert.alert('确认', '确定要清空所有聊天记录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '确定', style: 'destructive', onPress: clearMessages },
    ]);
  };

  const handleClearAllData = () => {
    Alert.alert(
      '⚠️ 清除全部数据',
      '这将删除所有食物记录、体重记录、聊天记录和运动数据。个人资料和API Key设置将被保留。\n\n此操作不可撤销，确定继续？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定清除',
          style: 'destructive',
          onPress: async () => {
            const keys = [
              'nutriflow_food_entries',
              'nutriflow_day_records',
              'nutriflow_weight_entries',
              'nutriflow_chat_messages',
              'nutriflow_achievements',
            ];
            await AsyncStorage.multiRemove(keys);
            clearMessages();
            Alert.alert('完成', '所有数据已清除，请重启应用以刷新状态。');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>设置</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>个人信息</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>性别</Text>
            <View style={styles.chipRow}>
              {(['male', 'female'] as const).map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, profile.gender === g && styles.chipSelected]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.chipText, profile.gender === g && styles.chipTextSelected]}>
                    {GENDER_LABELS[g]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>年龄</Text>
            <TextInput
              style={styles.smallInput}
              value={String(profile.age)}
              onChangeText={(text) => {
                const result = validateAge(text);
                if (result.isValid) {
                  setAge(result.value);
                } else if (text === '' || text === '0') {
                  // 允许清空或输入过程中
                } else if (result.error) {
                  Alert.alert('输入错误', result.error);
                }
              }}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>身高 (cm)</Text>
            <TextInput
              style={styles.smallInput}
              value={String(profile.heightCm)}
              onChangeText={(text) => {
                const result = validateHeight(text);
                if (result.isValid) {
                  setHeight(result.value);
                } else if (text === '' || text === '0') {
                  // 允许清空或输入过程中
                } else if (result.error) {
                  Alert.alert('输入错误', result.error);
                }
              }}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>体重 (kg)</Text>
            <TextInput
              style={styles.smallInput}
              value={String(profile.weightKg)}
              onChangeText={(text) => {
                const result = validateWeight(text);
                if (result.isValid) {
                  setWeight(result.value);
                } else if (text === '' || text === '0') {
                  // 允许清空或输入过程中
                } else if (result.error) {
                  Alert.alert('输入错误', result.error);
                }
              }}
              keyboardType="decimal-pad"
              maxLength={5}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>目标体重 (kg)</Text>
            <TextInput
              style={styles.smallInput}
              value={String(profile.goalWeightKg)}
              onChangeText={(text) => {
                const result = validateGoalWeight(text);
                if (result.isValid) {
                  setGoalWeight(result.value);
                } else if (text === '' || text === '0') {
                  // 允许清空或输入过程中
                } else if (result.error) {
                  Alert.alert('输入错误', result.error);
                }
              }}
              keyboardType="decimal-pad"
              maxLength={5}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>活动水平</Text>
          </View>
          <View style={styles.chipRow}>
            {(['sedentary', 'light', 'moderate', 'active', 'very_active'] as const).map(level => (
              <TouchableOpacity
                key={level}
                style={[styles.chip, profile.activityLevel === level && styles.chipSelected]}
                onPress={() => setActivityLevel(level)}
              >
                <Text style={[styles.chipText, profile.activityLevel === level && styles.chipTextSelected]}>
                  {ACTIVITY_LABELS[level]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>目标</Text>
          </View>
          <View style={styles.chipRow}>
            {(['lose', 'maintain', 'gain'] as const).map(goal => (
              <TouchableOpacity
                key={goal}
                style={[styles.chip, profile.weightGoal === goal && styles.chipSelected]}
                onPress={() => setWeightGoal(goal)}
              >
                <Text style={[styles.chipText, profile.weightGoal === goal && styles.chipTextSelected]}>
                  {GOAL_LABELS[goal]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 服务商</Text>
          {DEFAULT_PROVIDERS.map(provider => (
            <TouchableOpacity
              key={provider.id}
              style={[styles.providerCard, activeProviderId === provider.id && styles.providerCardSelected]}
              onPress={() => setActiveProvider(provider.id)}
            >
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{provider.name}</Text>
                <Text style={styles.providerUrl}>{provider.baseURL}</Text>
              </View>
              {activeProviderId === provider.id && <Text style={styles.providerCheck}>✓</Text>}
            </TouchableOpacity>
          ))}

          <View style={styles.apiKeySection}>
            <Text style={styles.settingLabel}>API Key</Text>
            <View style={styles.apiKeyRow}>
              <TextInput
                style={styles.apiKeyInput}
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                placeholder="输入 API Key"
                placeholderTextColor="#BDBDBD"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
              <TouchableOpacity style={styles.saveKeyButton} onPress={handleSaveApiKey}>
                <Text style={styles.saveKeyButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.modelToggle}
            onPress={() => setShowModelConfig(!showModelConfig)}
          >
            <Text style={styles.modelToggleText}>
              {showModelConfig ? '收起模型配置 ▲' : '自定义模型 ▼'}
            </Text>
          </TouchableOpacity>

          {showModelConfig && (
            <View>
              <View style={styles.modelInfo}>
                <Text style={styles.modelLabel}>当前提供商：</Text>
                <Text style={styles.modelValue}>{activeProvider?.name || '-'}</Text>
              </View>

              <View style={styles.modelRow}>
                <View style={styles.modelInfo}>
                  <Text style={styles.modelLabel}>📸 视觉模型（食物识别）</Text>
                  <Text style={styles.modelDesc}>
                    {activeProvider?.models.vision || '-'}
                  </Text>
                </View>
              </View>

              <View style={styles.apiKeyRow}>
                <TextInput
                  style={styles.apiKeyInput}
                  value={visionModelInput}
                  onChangeText={setVisionModelInput}
                  placeholder={activeProvider?.models.vision || '输入自定义模型名'}
                  placeholderTextColor="#BDBDBD"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.saveKeyButton} onPress={handleSaveModel('vision')}>
                  <Text style={styles.saveKeyButtonText}>更新</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.resetLink} onPress={handleResetModel('vision')}>
                <Text style={styles.resetText}>恢复默认: {activeDefault?.models.vision}</Text>
              </TouchableOpacity>

              <View style={[styles.modelRow, { marginTop: 12 }]}>
                <View style={styles.modelInfo}>
                  <Text style={styles.modelLabel}>📋 OCR模型（营养标签识别）</Text>
                  <Text style={styles.modelDesc}>
                    {activeProvider?.models.ocr || '-'}
                  </Text>
                </View>
              </View>

              <View style={styles.apiKeyRow}>
                <TextInput
                  style={styles.apiKeyInput}
                  value={ocrModelInput}
                  onChangeText={setOcrModelInput}
                  placeholder={activeProvider?.models.ocr || '输入自定义模型名'}
                  placeholderTextColor="#BDBDBD"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.saveKeyButton} onPress={handleSaveModel('ocr')}>
                  <Text style={styles.saveKeyButtonText}>更新</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.resetLink} onPress={handleResetModel('ocr')}>
                <Text style={styles.resetText}>恢复默认: {activeDefault?.models.ocr}</Text>
              </TouchableOpacity>

              <View style={[styles.modelRow, { marginTop: 12 }]}>
                <View style={styles.modelInfo}>
                  <Text style={styles.modelLabel}>💬 对话模型（AI教练）</Text>
                  <Text style={styles.modelDesc}>
                    {activeProvider?.models.chat || '-'}
                  </Text>
                </View>
              </View>

              <View style={styles.apiKeyRow}>
                <TextInput
                  style={styles.apiKeyInput}
                  value={chatModelInput}
                  onChangeText={setChatModelInput}
                  placeholder={activeProvider?.models.chat || '输入自定义模型名'}
                  placeholderTextColor="#BDBDBD"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.saveKeyButton} onPress={handleSaveModel('chat')}>
                  <Text style={styles.saveKeyButtonText}>更新</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.resetLink} onPress={handleResetModel('chat')}>
                <Text style={styles.resetText}>恢复默认: {activeDefault?.models.chat}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据管理</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleClearChat}>
            <Text style={styles.dangerButtonText}>清空聊天记录</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dangerButton, { marginTop: 10, backgroundColor: '#D32F2F' }]} onPress={handleClearAllData}>
            <Text style={[styles.dangerButtonText, { color: '#FFFFFF' }]}>清除全部数据</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>NutriFlow v1.0.0</Text>
          <Text style={styles.footerSubtext}>本地优先 · 隐私至上</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  smallInput: {
    width: 80,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'right',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  providerCardSelected: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  providerUrl: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  providerCheck: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '700',
  },
  apiKeySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  apiKeyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  apiKeyInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.text,
  },
  saveKeyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  saveKeyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  modelToggle: {
    paddingVertical: 10,
    marginTop: 4,
    alignItems: 'center',
  },
  modelToggleText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  modelInfo: {
    marginBottom: 4,
  },
  modelRow: {
    marginBottom: 2,
  },
  modelLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  modelDesc: {
    fontSize: 12,
    color: COLORS.text,
    fontFamily: 'monospace',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 2,
  },
  modelValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  resetLink: {
    paddingVertical: 4,
    marginBottom: 4,
  },
  resetText: {
    fontSize: 11,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  dangerButton: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  footerSubtext: {
    fontSize: 11,
    color: '#BDBDBD',
    marginTop: 4,
  },
});