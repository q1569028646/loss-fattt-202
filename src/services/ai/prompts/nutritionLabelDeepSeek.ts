export const DEEPSEEK_OCR_USER_PROMPT = `请识别图片中的文字`;

export function parseDeepSeekOCRResponse(content: string): Record<string, unknown> {
  // 1. 先尝试直接解析JSON（某些情况下模型可能返回JSON）
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (hasValidNutritionData(parsed)) return parsed;
    } catch {}
  }

  // 2. 尝试从内容中提取JSON
  let cleaned = content.trim().replace(/^[^{]+/, '').replace(/[^}]+$/, '');
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (hasValidNutritionData(parsed)) return parsed;
    } catch {}
  }

  // 3. 从Markdown表格、HTML表格或自由文本中提取数值
  const result = extractFromAnyFormat(content);
  if (hasValidNutritionData(result)) {
    return result;
  }

  return { error: `无法解析: ${content.substring(0, 100)}` };
}

function hasValidNutritionData(obj: Record<string, unknown>): boolean {
  return (obj.energy_kcal as number) > 0 ||
         (obj.energy_kj as number) > 0 ||
         (obj.protein_g as number) > 0 ||
         (obj.fat_g as number) > 0 ||
         (obj.carbs_g as number) > 0;
}

function extractFromAnyFormat(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {
    energy_kj: 0,
    energy_kcal: 0,
    protein_g: 0,
    fat_g: 0,
    carbs_g: 0,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    cholesterol_mg: 0,
    saturated_fat_g: 0,
    trans_fat_g: 0,
    serving_label: '',
    serving_base_grams: 100,
    product_name: '',
  };

  // 提取份量信息
  const servingMatch = content.match(/每\s*(\d+)\s*(g|ml|克|毫升)/i);
  if (servingMatch) {
    result.serving_label = servingMatch[0];
    result.serving_base_grams = parseInt(servingMatch[1]);
  }

  // 处理Markdown表格行: | 项目 | 数值 | ... |
  // 处理HTML表格行: <tr><td>项目</td><td>数值</td>...</tr>
  // 处理纯文本行: 项目名称 数值 单位

  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('|---') || trimmed.startsWith('| ---')) continue;

    let label = '';
    let valueStr = '';

    // Markdown表格
    if (trimmed.startsWith('|')) {
      const cells = trimmed.split('|').map(c => c.trim()).filter(c => c.length > 0);
      if (cells.length >= 2) {
        label = cells[0];
        valueStr = cells.slice(1).join(' ');
      }
    }
    // HTML表格
    else if (trimmed.includes('<td>')) {
      const tdMatch = trimmed.match(/<td[^>]*>(.*?)<\/td>/g);
      if (tdMatch && tdMatch.length >= 2) {
        label = tdMatch[0].replace(/<\/?td[^>]*>/g, '').trim();
        valueStr = tdMatch.slice(1).map(td => td.replace(/<\/?td[^>]*>/g, '').trim()).join(' ');
      }
    }
    // 纯文本
    else {
      const textMatch = trimmed.match(/^(.+?)\s+([\d.]+)\s*(g|mg|kJ|kcal|千焦|千卡)?/);
      if (textMatch) {
        label = textMatch[1];
        valueStr = trimmed.substring(textMatch[1].length).trim();
      }
    }

    if (!label) continue;

    // 提取数值（排除NRV%）
    const numMatch = valueStr.match(/([\d.]+)/);
    const value = numMatch ? parseFloat(numMatch[1]) : 0;

    // 匹配项目名
    if (/能量|energy/i.test(label) && !/碳水|carb|脂肪|fat|蛋白|protein/i.test(label)) {
      if (/kj|千焦/i.test(valueStr) || /kj|千焦/i.test(label)) {
        result.energy_kj = value;
      } else {
        result.energy_kcal = value;
      }
    } else if (/蛋白质|protein/i.test(label)) {
      result.protein_g = value;
    } else if (/饱和脂肪|saturated\s*fat/i.test(label)) {
      result.saturated_fat_g = value;
    } else if (/反式脂肪|trans\s*fat/i.test(label)) {
      result.trans_fat_g = value;
    } else if (/脂肪|fat/i.test(label) && !/饱和|反式|saturated|trans/i.test(label)) {
      result.fat_g = value;
    } else if (/碳水|carb/i.test(label) && !/糖|sugar/i.test(label)) {
      result.carbs_g = value;
    } else if (/纤维|fiber/i.test(label)) {
      result.fiber_g = value;
    } else if (/糖|sugar/i.test(label) && !/碳水/i.test(label)) {
      result.sugar_g = value;
    } else if (/钠|sodium/i.test(label)) {
      result.sodium_mg = value;
    } else if (/胆固醇|cholesterol/i.test(label)) {
      result.cholesterol_mg = value;
    }
  }

  return result;
}
