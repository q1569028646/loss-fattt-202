import { create } from 'zustand';
import type { AIProviderConfig } from '../services/ai/types';
import { DEFAULT_PROVIDERS, getDefaultProviderConfig } from '../services/ai/types';
import { AIClient } from '../services/ai/AIClient';
import { getItemAsync, setItemAsync } from '../utils/storage';

interface AIProviderState {
  activeProviderId: string;
  providers: AIProviderConfig[];
  initialized: boolean;
  initialize: () => Promise<void>;
  setApiKey: (providerId: string, key: string) => Promise<void>;
  setActiveProvider: (providerId: string) => void;
  setModel: (providerId: string, modelType: 'vision' | 'ocr' | 'chat', model: string) => Promise<void>;
  setVisionModel: (providerId: string, model: string) => Promise<void>;
  setOcrModel: (providerId: string, model: string) => Promise<void>;
  setChatModel: (providerId: string, model: string) => Promise<void>;
  getActiveClient: () => AIClient;
}

export const useAIProviderStore = create<AIProviderState>((set, get) => ({
  activeProviderId: 'siliconflow',
  providers: DEFAULT_PROVIDERS.map(p => ({ ...p, apiKey: '' })),
  initialized: false,

  initialize: async () => {
    try {
      const providersWithConfig = await Promise.all(
        DEFAULT_PROVIDERS.map(async p => {
          try {
            const apiKey = (await getItemAsync(`ai_key_${p.id}`)) || '';
            const customVision = await getItemAsync(`ai_vision_${p.id}`);
            const customOcr = await getItemAsync(`ai_ocr_${p.id}`);
            const customChat = await getItemAsync(`ai_chat_${p.id}`);
            return {
              ...p,
              apiKey,
              models: {
                vision: customVision || p.models.vision,
                ocr: customOcr || p.models.ocr,
                chat: customChat || p.models.chat,
              },
            };
          } catch (error) {
            console.error(`Failed to load config for provider ${p.id}:`, error);
            return { 
              ...p, 
              apiKey: '' 
            };
          }
        })
      );
      const savedActiveId = await getItemAsync('ai_active_provider');
      set({
        providers: providersWithConfig,
        activeProviderId: savedActiveId || 'siliconflow',
        initialized: true,
      });
    } catch (error) {
      console.error('Failed to initialize AI provider store:', error);
      set({
        providers: DEFAULT_PROVIDERS.map(p => ({ 
          ...p, 
          apiKey: '' 
        })),
        activeProviderId: 'siliconflow',
        initialized: true,
      });
    }
  },

  setApiKey: async (providerId, key) => {
    await setItemAsync(`ai_key_${providerId}`, key);
    set(state => ({
      providers: state.providers.map(p =>
        p.id === providerId ? { ...p, apiKey: key } : p
      ),
    }));
  },

  setActiveProvider: (providerId) => {
    setItemAsync('ai_active_provider', providerId);
    set({ activeProviderId: providerId });
  },

  setModel: async (providerId, modelType, model) => {
    await setItemAsync(`ai_${modelType}_${providerId}`, model);
    set(state => ({
      providers: state.providers.map(p =>
        p.id === providerId
          ? { ...p, models: { ...p.models, [modelType]: model } }
          : p
      ),
    }));
  },

  setVisionModel: async (providerId, model) => { await get().setModel(providerId, 'vision', model); },
  setOcrModel: async (providerId, model) => { await get().setModel(providerId, 'ocr', model); },
  setChatModel: async (providerId, model) => { await get().setModel(providerId, 'chat', model); },

  getActiveClient: () => {
    const state = get();
    const provider = state.providers.find(p => p.id === state.activeProviderId);
    if (!provider) {
      throw new Error('AI provider not found. Please check your provider configuration.');
    }
    if (!provider.apiKey) {
      throw new Error('API Key not set. Please configure your API key in settings.');
    }
    return new AIClient(provider);
  },
}));
