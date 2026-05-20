/**
 * 主题状态管理
 * 管理亮色/暗色主题切换
 */

import { create } from 'zustand';
import { getItemAsync, setItemAsync } from '../utils/storage';
import type { ThemeMode, ThemeColors } from '../utils/theme';
import { lightTheme, darkTheme } from '../utils/theme';

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  initialized: boolean;
  initialize: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  colors: lightTheme,
  initialized: false,

  initialize: async () => {
    try {
      const saved = await getItemAsync('theme_mode');
      const mode = (saved as ThemeMode) || 'light';
      set({
        mode,
        colors: mode === 'dark' ? darkTheme : lightTheme,
        initialized: true,
      });
    } catch {
      set({ initialized: true });
    }
  },

  setMode: async (mode: ThemeMode) => {
    await setItemAsync('theme_mode', mode);
    set({
      mode,
      colors: mode === 'dark' ? darkTheme : lightTheme,
    });
  },

  toggleTheme: async () => {
    const { mode } = get();
    const newMode = mode === 'dark' ? 'light' : 'dark';
    await setItemAsync('theme_mode', newMode);
    set({
      mode: newMode,
      colors: newMode === 'dark' ? darkTheme : lightTheme,
    });
  },
}));
