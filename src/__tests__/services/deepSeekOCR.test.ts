import { parseDeepSeekOCRResponse } from '../../services/ai/prompts/nutritionLabelDeepSeek';

describe('parseDeepSeekOCRResponse', () => {
  it('parses plain JSON response', () => {
    const content = '{"energy_kj": 1520, "energy_kcal": 363, "protein_g": 12.5}';
    const result = parseDeepSeekOCRResponse(content);
    expect(result.energy_kj).toBe(1520);
    expect(result.protein_g).toBe(12.5);
  });

  it('parses JSON in markdown code block', () => {
    const content = '```json\n{"energy_kj": 1520, "protein_g": 12.5}\n```';
    const result = parseDeepSeekOCRResponse(content);
    expect(result.energy_kj).toBe(1520);
    expect(result.protein_g).toBe(12.5);
  });

  it('parses JSON in plain code block', () => {
    const content = '```\n{"energy_kj": 1520, "protein_g": 12.5}\n```';
    const result = parseDeepSeekOCRResponse(content);
    expect(result.energy_kj).toBe(1520);
    expect(result.protein_g).toBe(12.5);
  });

  it('parses JSON embedded in text', () => {
    const content = 'Here is the extracted data: {"energy_kj": 1520, "protein_g": 12.5} Thank you!';
    const result = parseDeepSeekOCRResponse(content);
    expect(result.energy_kj).toBe(1520);
    expect(result.protein_g).toBe(12.5);
  });

  it('returns error for invalid JSON', () => {
    const content = 'This is not JSON at all';
    const result = parseDeepSeekOCRResponse(content);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('无法解析');
  });

  it('parses complete nutrition label response', () => {
    const content = JSON.stringify({
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
    });
    const result = parseDeepSeekOCRResponse(content);
    expect(result.product_name).toBe('测试饼干');
    expect(result.serving_label).toBe('每100g');
    expect(result.trans_fat_g).toBe(0);
  });

  it('parses English text response with nutrition data', () => {
    const content = 'The nutritional information table in the image contains the following information:\n\n* Calories per serving: 250\n* Total fat per serving: 10g\n* Saturated fat per serving: 2g\n* Trans fat per serving: 0g';
    const result = parseDeepSeekOCRResponse(content);
    expect(result.error).toBeUndefined();
    expect(result.energy_kcal).toBe(250);
    expect(result.fat_g).toBe(10);
    expect(result.saturated_fat_g).toBe(2);
    expect(result.trans_fat_g).toBe(0);
  });

  it('parses English text with bullet points format', () => {
    const content = 'Nutrition facts:\n* Calories: 200\n* Protein: 5g\n* Total fat: 8g\n* Carbohydrates: 30g\n* Sodium: 150mg';
    const result = parseDeepSeekOCRResponse(content);
    expect(result.error).toBeUndefined();
    expect(result.energy_kcal).toBe(200);
    expect(result.protein_g).toBe(5);
    expect(result.fat_g).toBe(8);
    expect(result.carbs_g).toBe(30);
    expect(result.sodium_mg).toBe(150);
  });
});
