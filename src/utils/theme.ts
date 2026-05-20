/**
 * 主题系统
 * 支持亮色/暗色主题切换，可跟随系统主题
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  /** 页面背景 */
  background: string;
  /** 卡片/组件背景 */
  surface: string;
  /** 主色调 */
  primary: string;
  primaryDark: string;
  primaryLight: string;
  /** 强调色 */
  accent: string;
  /** 文字色 */
  text: string;
  textSecondary: string;
  /** 错误色 */
  error: string;
  /** 营养素颜色 */
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  sodium: string;
  /** 图表色 */
  chartGrid: string;
  chartFill: string;
  /** 分隔线 */
  border: string;
  /** 骨架屏 */
  skeleton: string;
  skeletonHighlight: string;
}

export const lightTheme: ThemeColors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  primary: '#4CAF50',
  primaryDark: '#388E3C',
  primaryLight: '#E8F5E9',
  accent: '#FF9800',
  text: '#1A1A2E',
  textSecondary: '#8E8E93',
  error: '#F44336',
  protein: '#2196F3',
  carbs: '#FF9800',
  fat: '#F44336',
  fiber: '#4CAF50',
  sugar: '#E91E63',
  sodium: '#607D8B',
  chartGrid: '#E0E0E0',
  chartFill: 'rgba(76, 175, 80, 0.15)',
  border: '#EEEEEE',
  skeleton: '#E1E1E1',
  skeletonHighlight: '#F5F5F5',
};

export const darkTheme: ThemeColors = {
  background: '#0D1117',
  surface: '#161B22',
  primary: '#4CAF50',
  primaryDark: '#388E3C',
  primaryLight: '#1B3A1E',
  accent: '#FF9800',
  text: '#E6EDF3',
  textSecondary: '#8B949E',
  error: '#F44336',
  protein: '#58A6FF',
  carbs: '#FFA657',
  fat: '#F7788B',
  fiber: '#56D364',
  sugar: '#F778BA',
  sodium: '#8B949E',
  chartGrid: '#30363D',
  chartFill: 'rgba(76, 175, 80, 0.1)',
  border: '#30363D',
  skeleton: '#21262D',
  skeletonHighlight: '#30363D',
};

// 兼容旧的 COLORS 常量
export const COLORS = {
  ...lightTheme,
  get primaryLightBg() { return lightTheme.primaryLight; },
};
