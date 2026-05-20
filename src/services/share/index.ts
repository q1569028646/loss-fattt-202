/**
 * 分享服务
 * 支持生成分享图片和调用系统分享
 */

import type { FoodEntry } from '../../types';

export type ShareTemplate = 'simple' | 'detailed' | 'achievement';

interface ShareData {
  date: string;
  template: ShareTemplate;
  calories?: number;
  target?: number;
  protein?: number;
  proteinTarget?: number;
  streak?: number;
  achievement?: string;
  foodEntries?: FoodEntry[];
}

/**
 * 生成分享文本
 */
export function generateShareText(data: ShareData): string {
  switch (data.template) {
    case 'achievement':
      return `🎉 我在 NutriFlow 解锁了新成就！\n${data.achievement || ''}\n连续记录了 ${data.streak || 0} 天 💪`;
    
    case 'detailed':
      return [
        `📊 ${data.date} 营养日报`,
        `热量: ${data.calories || 0}/${data.target || 0} kcal`,
        `蛋白质: ${data.protein?.toFixed(1) || 0}/${data.proteinTarget || 0}g`,
        data.streak ? `连续记录: ${data.streak} 天 🔥` : '',
        '',
        '—— NutriFlow 记录',
      ].filter(Boolean).join('\n');
    
    default:
      return [
        `🍽️ ${data.date} 今天打卡成功！`,
        `热量: ${data.calories || 0} kcal`,
        data.streak ? `已连续记录 ${data.streak} 天 🔥` : '',
        '',
        '—— NutriFlow',
      ].filter(Boolean).join('\n');
  }
}

/**
 * 调用系统分享
 */
export async function shareContent(text: string): Promise<void> {
  try {
    // 使用 expo-sharing 或 react-native Share API
    const { Share } = require('react-native');
    await Share.share({ message: text });
  } catch {
    // 分享失败，静默处理
  }
}
