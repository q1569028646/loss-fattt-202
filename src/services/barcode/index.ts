/**
 * 条码扫描服务
 * 通过 Open Food Facts API 查询食品营养信息
 */

import type { Nutrients } from '../../types';

const API_BASE = 'https://world.openfoodfacts.org/api/v2';

export interface BarcodeResult {
  barcode: string;
  productName: string;
  brand?: string;
  nutrients: Nutrients;
  imageUrl?: string;
  error?: string;
}

/**
 * 通过条码查询食品信息
 */
export async function fetchProductByBarcode(barcode: string): Promise<BarcodeResult> {
  try {
    const resp = await fetch(`${API_BASE}/product/${barcode}`);
    const data = await resp.json();

    if (data.status === 0) {
      return {
        barcode,
        productName: '',
        nutrients: emptyNutrients(),
        error: '未找到该条码对应的食品',
      };
    }

    const product = data.product;
    const nutriments = product.nutriments || {};

    return {
      barcode,
      productName: product.product_name || product.generic_name || '未知产品',
      brand: product.brands,
      nutrients: {
        calories_kcal: +(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
        protein_g: +(nutriments.proteins_100g || nutriments.proteins || 0),
        carbs_g: +(nutriments.carbohydrates_100g || nutriments.carbohydrates || 0),
        fat_g: +(nutriments.fat_100g || nutriments.fat || 0),
        fiber_g: +(nutriments.fiber_100g || nutriments.fiber || 0),
        sugar_g: +(nutriments.sugars_100g || nutriments.sugars || 0),
        sodium_mg: +(nutriments.sodium_100g || nutriments.sodium || 0) * 1000,
        cholesterol_mg: 0,
        potassium_mg: 0,
        vitamin_a_mcg: 0,
        vitamin_c_mg: 0,
        calcium_mg: 0,
        iron_mg: 0,
      },
      imageUrl: product.image_url,
    };
  } catch (e) {
    return {
      barcode,
      productName: '',
      nutrients: emptyNutrients(),
      error: `查询失败: ${e instanceof Error ? e.message : '网络错误'}`,
    };
  }
}

function emptyNutrients(): Nutrients {
  return {
    calories_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0,
    sugar_g: 0, sodium_mg: 0, cholesterol_mg: 0, potassium_mg: 0,
    vitamin_a_mcg: 0, vitamin_c_mg: 0, calcium_mg: 0, iron_mg: 0,
  };
}

// Barcode 扫描器（使用 expo-barcode-scanner）
// 注意：需要在 expo 环境中才能使用，Web 端暂不支持
export async function scanBarcode(): Promise<string | null> {
  try {
    // 尝试动态导入，Web 环境下会失败
    const { BarCodeScanner } = require('expo-barcode-scanner');
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    if (status !== 'granted') return null;
    // 实际扫描需要 UI 组件配合
    return null;
  } catch {
    return null;
  }
}
