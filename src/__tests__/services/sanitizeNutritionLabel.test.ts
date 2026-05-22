import { validateNutritionLabelResult } from '../../utils/validation';

describe('validateNutritionLabelResult', () => {
  it('returns error result when parsed has error field', () => {
    const result = validateNutritionLabelResult({ error: 'not a label' });
    expect(result.error).toBe('not a label');
    expect(result.energy_kj).toBe(0);
    expect(result.energy_kcal).toBe(0);
    expect(result.protein_g).toBe(0);
  });

  it('sanitizes complete valid input', () => {
    const input = {
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
      trans_fat_g: 0,
      serving_label: '每100g',
      serving_base_grams: 100,
      product_name: '测试饼干',
    };
    const result = validateNutritionLabelResult(input);
    expect(result.energy_kj).toBe(1520);
    expect(result.energy_kcal).toBe(363);
    expect(result.protein_g).toBe(12.5);
    expect(result.serving_label).toBe('每100g');
    expect(result.serving_base_grams).toBe(100);
    expect(result.product_name).toBe('测试饼干');
    expect(result.error).toBeUndefined();
  });

  it('fills defaults for missing numeric fields', () => {
    const input = {
      energy_kj: 500,
      energy_kcal: 120,
    };
    const result = validateNutritionLabelResult(input);
    expect(result.protein_g).toBe(0);
    expect(result.fat_g).toBe(0);
    expect(result.carbs_g).toBe(0);
    expect(result.fiber_g).toBe(0);
    expect(result.sugar_g).toBe(0);
    expect(result.sodium_mg).toBe(0);
    expect(result.cholesterol_mg).toBe(0);
    expect(result.saturated_fat_g).toBe(0);
    expect(result.trans_fat_g).toBe(0);
    expect(result.serving_base_grams).toBe(100);
    expect(result.serving_label).toBe('');
    expect(result.product_name).toBe('');
  });

  it('handles undefined serving_base_grams without NaN', () => {
    const input = {
      energy_kj: 800,
      energy_kcal: 191,
      serving_base_grams: undefined,
    };
    const result = validateNutritionLabelResult(input);
    expect(result.serving_base_grams).toBe(100);
    expect(isNaN(result.serving_base_grams)).toBe(false);
  });

  it('converts string numbers to actual numbers', () => {
    const input = {
      energy_kj: '1520',
      energy_kcal: '363',
      protein_g: '12.5',
      sodium_mg: '450',
      serving_base_grams: '100',
    };
    const result = validateNutritionLabelResult(input);
    expect(result.energy_kj).toBe(1520);
    expect(result.energy_kcal).toBe(363);
    expect(result.protein_g).toBe(12.5);
    expect(result.sodium_mg).toBe(450);
    expect(result.serving_base_grams).toBe(100);
  });

  it('handles null values gracefully', () => {
    const input = {
      energy_kj: null,
      energy_kcal: null,
      protein_g: null,
      serving_base_grams: null,
      product_name: null,
    };
    const result = validateNutritionLabelResult(input);
    expect(result.energy_kj).toBe(0);
    expect(result.energy_kcal).toBe(0);
    expect(result.protein_g).toBe(0);
    expect(result.serving_base_grams).toBe(100);
    expect(result.product_name).toBe('');
  });

  it('auto-converts kJ to kcal when only kJ is provided', () => {
    const input = {
      energy_kj: 1520,
      energy_kcal: 0,
      protein_g: 12.5,
    };
    const result = validateNutritionLabelResult(input);
    expect(result.energy_kj).toBe(1520);
    expect(result.energy_kcal).toBe(363.3);
  });

  it('auto-converts kcal to kJ when only kcal is provided', () => {
    const input = {
      energy_kj: 0,
      energy_kcal: 363,
      protein_g: 12.5,
    };
    const result = validateNutritionLabelResult(input);
    expect(result.energy_kcal).toBe(363);
    expect(result.energy_kj).toBe(1518.8);
  });

  it('does not overwrite when both kJ and kcal are provided', () => {
    const input = {
      energy_kj: 1520,
      energy_kcal: 363,
    };
    const result = validateNutritionLabelResult(input);
    expect(result.energy_kj).toBe(1520);
    expect(result.energy_kcal).toBe(363);
  });

  it('does not convert when both energy values are zero', () => {
    const input = {
      energy_kj: 0,
      energy_kcal: 0,
    };
    const result = validateNutritionLabelResult(input);
    expect(result.energy_kj).toBe(0);
    expect(result.energy_kcal).toBe(0);
  });
});
