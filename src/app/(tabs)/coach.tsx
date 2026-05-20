import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '../../utils/constants';
import { useChatStore } from '../../stores/chatStore';
import { useAIProviderStore } from '../../stores/aiProviderStore';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { PromptChips } from '../../components/chat/PromptChips';

const QUICK_PROMPTS = [
  '我今天吃得怎么样？',
  '推荐一个低卡晚餐',
  '我还需要多少蛋白质？',
  '预测我什么时候能达标',
];

export default function CoachScreen() {
  const router = useRouter();
  const { messages, isLoading, error, loadMessages, sendMessage } = useChatStore();
  const { providers, activeProviderId } = useAIProviderStore();
  const activeProvider = providers.find(p => p.id === activeProviderId);
  const hasApiKey = !!activeProvider?.apiKey;
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    let isMounted = true;
    loadMessages().catch(() => {}).finally(() => {
      if (!isMounted) return;
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // 使用requestAnimationFrame避免过于频繁的滚动
    const frameId = requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!hasApiKey) {
      router.push('/(tabs)/settings');
      return;
    }
    const text = input.trim();
    setInput('');
    try {
      await sendMessage(text);
    } catch {
      // Error already handled by chatStore
    }
  };

  const handlePromptSelect = async (prompt: string) => {
    if (!hasApiKey) {
      router.push('/(tabs)/settings');
      return;
    }
    setInput('');
    try {
      await sendMessage(prompt);
    } catch {
      // Error already handled by chatStore
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🤖 AI 营养教练</Text>
          <Text style={styles.headerSubtitle}>基于你的数据提供个性化建议</Text>
        </View>

        {!hasApiKey && (
          <TouchableOpacity
            style={styles.apiKeyWarning}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Text style={styles.apiKeyWarningText}>
              ⚠️ 尚未配置API Key，AI教练不可用。点击前往设置 →
            </Text>
          </TouchableOpacity>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🥗</Text>
              <Text style={styles.emptyTitle}>你好！我是你的AI营养教练</Text>
              <Text style={styles.emptySubtitle}>你可以问我任何关于营养和饮食的问题</Text>
            </View>
          )}
          {messages.map(msg => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>正在思考...</Text>
            </View>
          )}
        </ScrollView>

        <PromptChips prompts={QUICK_PROMPTS} onSelect={handlePromptSelect} />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="问教练任何问题..."
            placeholderTextColor="#BDBDBD"
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  apiKeyWarning: {
    backgroundColor: '#FFF3E0', marginHorizontal: 16, borderRadius: 10, padding: 12, marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: COLORS.accent,
  },
  apiKeyWarningText: { fontSize: 13, color: '#E65100', fontWeight: '500' },
  errorBanner: {
    backgroundColor: '#FFEBEE', marginHorizontal: 16, borderRadius: 10, padding: 12, marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: COLORS.error,
  },
  errorText: { fontSize: 13, color: COLORS.error, fontWeight: '500' },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  typingIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    maxHeight: 80,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
