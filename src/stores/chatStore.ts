import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from '../types';
import { useAIProviderStore } from './aiProviderStore';
import { useProfileStore } from './profileStore';
import { useFoodStore } from './foodStore';

const STORAGE_KEY = 'nutriflow_chat_messages';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  loadMessages: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => Promise<void>;
}

async function loadStoredMessages(): Promise<ChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveMessages(messages: ChatMessage[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,

  loadMessages: async () => {
    try {
      const messages = await loadStoredMessages();
      set({ messages });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  sendMessage: async (content) => {
    set({ isLoading: true, error: null });
    try {
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content,
        createdAt: Date.now(),
      };

      const currentMessages = [...get().messages, userMessage];
      set({ messages: currentMessages });

      const { getActiveClient } = useAIProviderStore.getState();
      const client = getActiveClient();
      const { profile } = useProfileStore.getState();
      const { todayEntries } = useFoodStore.getState();

      const response = await client.chatWithCoachNonStream(currentMessages, profile, todayEntries);

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_resp`,
        role: 'assistant',
        content: response,
        createdAt: Date.now(),
      };

      const allMessages = [...currentMessages, assistantMessage];
      await saveMessages(allMessages);
      set({ messages: allMessages, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || String(err), isLoading: false });
    }
  },

  clearMessages: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ messages: [] });
  },
}));
