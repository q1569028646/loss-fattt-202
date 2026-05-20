export const DEEPSEEK_OCR_USER_PROMPT = `<image>
<|grounding|>提取营养成分表数据，返回JSON：
{"energy_kj":0,"energy_kcal":0,"protein_g":0,"fat_g":0,"carbs_g":0,"fiber_g":0,"sugar_g":0,"sodium_mg":0,"cholesterol_mg":0,"saturated_fat_g":0,"trans_fat_g":0,"serving_label":"","serving_base_grams":100,"product_name":"","error":""}

规则：
- 能量单位自动转换：kcal = kJ ÷ 4.184
- 仅返回JSON，不要解释`;

export function parseDeepSeekOCRResponse(content: string): Record<string, unknown> {
  // 尝试从代码块中提取JSON
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }

  // 尝试直接解析JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {}
  }

  // 尝试直接解析
  try {
    return JSON.parse(content.trim());
  } catch {}

  // 尝试从文本中提取营养数据
  const result = extractFromText(content);
  if ((result.energy_kcal as number) > 0 || (result.protein_g as number) > 0) {
    return result;
  }

  return { error: `无法解析: ${content.substring(0, 100)}` };
}

function extractFromText(content: string): Record<string, unknown> {
  const extract = (pattern: RegExp): number => {
    const match = content.match(pattern);
    return match ? parseFloat(match[1]) : 0;
  };

  return {
    energy_kcal: extract(/calories?\s*(?:per\s*serving)?[：:]*\s*([\d.]+)/i) ||
                 extract(/热量[：:]*\s*([\d.]+)/i),
    energy_kj: extract(/(?:energy|kJ)\s*(?:per\s*serving)?[：:]*\s*([\d.]+)\s*kJ/i),
    protein_g: extract(/protein\s*(?:per\s*serving)?[：:]*\s*([\d.]+)/i) ||
               extract(/蛋白质[：:]*\s*([\d.]+)/i),
    fat_g: extract(/(?:total\s*)?fat\s*(?:per\s*serving)?[：:]*\s*([\d.]+)/i) ||
                extract(/脂肪[：:]*\s*([\d.]+)/i),
    carbs_g: extract(/carb(?:ohydrate)?s?\s*(?:per\s*serving)?[：:]*\s*([\d.]+)/i) ||
                  extract(/碳水[化合物]?[：:]*\s*([\d.]+)/i),
    fiber_g: extract(/fiber\s*(?:per\s*serving)?[：:]*\s*([\d.]+)/i) ||
              extract(/纤维[：:]*\s*([\d.]+)/i),
    sugar_g: extract(/sugar\s*(?:per\s*serving)?[：:]*\s*([\d.]+)/i) ||
             extract(/糖[：:]*\s*([\d.]+)/i),
    sodium_mg: extract(/sodium\s*(?:per\s*serving)?[：:]*\s*([\d.]+)/i) ||
               extract(/钠[：:]*\s*([\d.]+)/i),
    cholesterol_mg: extract(/cholesterol\s*(?:per\s*serving)?[：:]*\s*([\d.]+)/i) ||
                   extract(/胆固醇[：:]*\s*([\d.]+)/i),
    saturated_fat_g: extract(/saturated\s*fat\s*(?:per\s*serving)?[：:]*\s*([\d.]+)/i) ||
                    extract(/饱和脂肪[：:]*\s*([\d.]+)/i),
    trans_fat_g: extract(/trans\s*fat\s*(?:per\s*serving)?[：:]*\s*([\d.]+)/i) ||
                 extract(/反式脂肪[：:]*\s*([\d.]+)/i),
    serving_label: '',
    serving_base_grams: 100,
    product_name: '',
  };
}
