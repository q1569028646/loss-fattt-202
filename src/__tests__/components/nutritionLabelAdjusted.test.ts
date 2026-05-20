import type { NutritionLabelResult } from '../../types';

function calcAdjusted(result: NutritionLabelResult, grams: number) {
  if (grams <= 0 || result.serving_base_grams <= 0) return null;
  const ratio = grams / result.serving_base_grams;
  return {
    energy_kj: Math.round(result.energy_kj * ratio * 10) / 10,
    energy_kcal: Math.round(result.energy_kcal * ratio * 10) / 10,
    protein_g: Math.round(result.protein_g * ratio * 10) / 10,
    fat_g: Math.round(result.fat_g * ratio * 10) / 10,
    carbs_g: Math.round(result.carbs_g * ratio * 10) / 10,
    fiber_g: Math.round(result.fiber_g * ratio * 10) / 10,
    sugar_g: Math.round(result.sugar_g * ratio * 10) / 10,
    sodium_mg: Math.round(result.sodium_mg * ratio),
    cholesterol_mg: Math.round(result.cholesterol_mg * ratio),
    saturated_fat_g: Math.round(result.saturated_fat_g * ratio * 10) / 10,
    trans_fat_g: Math.round(result.trans_fat_g * ratio * 10) / 10,
  };
}

const sampleResult: NutritionLabelResult = {
  energy_kj: 1520,
  energy_kcal: 363,
  protein_g: 12.5,
  fat_g: 8.6,
  carbs_g: 55.2,
  fiber_g: 3.2,
  sugar_g: 10,
  sodium_mg: 450,
  cholesterol_mg: 5,
  saturated_fat_g: 2.3,
  trans_fat_g: 0.5,
  serving_label: '每100g',
  serving_base_grams: 100,
  product_name: '测试饼干',
};

describe('calcAdjusted (NutritionLabelResult ratio calculation)', () => {
  it('returns null for zero grams', () => {
    expect(calcAdjusted(sampleResult, 0)).toBeNull();
  });

  it('returns null for negative grams', () => {
    expect(calcAdjusted(sampleResult, -10)).toBeNull();
  });

  it('calculates correct ratio for 50g (half of 100g base)', () => {
    const adj = calcAdjusted(sampleResult, 50);
    expect(adj).not.toBeNull();
    expect(adj!.energy_kcal).toBe(181.5);
    expect(adj!.protein_g).toBe(6.3);
    expect(adj!.fat_g).toBe(4.3);
    expect(adj!.carbs_g).toBe(27.6);
  });

  it('calculates cholesterol adjusted value', () => {
    const adj = calcAdjusted(sampleResult, 50);
    expect(adj!.cholesterol_mg).toBe(3);
  });

  it('calculates saturated_fat adjusted value', () => {
    const adj = calcAdjusted(sampleResult, 50);
    expect(adj!.saturated_fat_g).toBe(1.2);
  });

  it('calculates trans_fat adjusted value', () => {
    const adj = calcAdjusted(sampleResult, 50);
    expect(adj!.trans_fat_g).toBe(0.3);
  });

  it('returns 1:1 ratio when grams equals base', () => {
    const adj = calcAdjusted(sampleResult, 100);
    expect(adj!.energy_kcal).toBe(363);
    expect(adj!.protein_g).toBe(12.5);
    expect(adj!.cholesterol_mg).toBe(5);
    expect(adj!.saturated_fat_g).toBe(2.3);
    expect(adj!.trans_fat_g).toBe(0.5);
  });

  it('handles zero base grams safely', () => {
    const zeroBase = { ...sampleResult, serving_base_grams: 0 };
    expect(calcAdjusted(zeroBase, 50)).toBeNull();
  });
});
