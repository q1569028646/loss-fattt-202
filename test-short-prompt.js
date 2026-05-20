const fs = require('fs');
const path = require('path');

async function test() {
  const imagePath = path.join(__dirname, 'docs/plans/a23729648c204532cba2978ea4ecc58e.jpg');
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');

  const apiKey = 'sk-wwwyzmertnkclikeqoyjmtdxobrhtwtjuwmrjztjljqjbaxe';
  const model = 'deepseek-ai/DeepSeek-OCR';

  console.log('=== 测试不同长度的提示词 ===\n');

  const tests = [
    {
      name: '简短提示词',
      content: `<image>\n<|grounding|>OCR this image and return JSON with energy_kcal, protein_g, fat_g, carbs_g.`
    },
    {
      name: '中等提示词',
      content: `<image>\n<|grounding|>OCR this nutrition label. Return JSON: {energy_kcal, protein_g, fat_g, carbs_g, sodium_mg, product_name}`
    },
    {
      name: '长提示词（当前App用）',
      content: `<image>\n<|grounding|>OCR this nutrition facts label and extract all data into a strictly valid JSON object with these exact fields:
- energy_kj: number
- energy_kcal: number
- protein_g: number
- fat_g: number
- carbs_g: number
- fiber_g: number
- sugar_g: number
- sodium_mg: number
- cholesterol_mg: number
- saturated_fat_g: number
- trans_fat_g: number
- serving_label: string
- serving_base_grams: number
- product_name: string
- error: string

Rules:
- Extract exact numbers from the label. Do NOT estimate.
- If energy is in kJ, also calculate kcal. If in kcal, also calculate kJ.
- If a field is not on the label, set it to 0.
- Return ONLY the JSON object, no markdown formatting, no explanation.`
    }
  ];

  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`测试: ${test.name}`);
    console.log(`提示词长度: ${test.content.length} 字符`);
    console.log('='.repeat(60));

    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: test.content }],
        max_tokens: 2048,
        temperature: 0.05
      })
    });

    console.log('状态码:', response.status);

    if (response.ok) {
      const result = JSON.parse(await response.text());
      const content = result.choices?.[0]?.message?.content;
      console.log('Content 长度:', content?.length || 0);
      console.log('Content:', content?.substring(0, 200) || '(空)');
    } else {
      console.log('错误:', await response.text());
    }

    await new Promise(r => setTimeout(r, 1000));
  }
}

test().catch(console.error);
