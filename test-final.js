const fs = require('fs');
const path = require('path');

async function test() {
  const imagePath = path.join(__dirname, 'docs/plans/a23729648c204532cba2978ea4ecc58e.jpg');
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');

  const apiKey = 'sk-wwwyzmertnkclikeqoyjmtdxobrhtwtjuwmrjztjljqjbaxe';
  const model = 'deepseek-ai/DeepSeek-OCR';

  console.log('=== 最终测试（修复后的提示词）===\n');

  const content = `<image>\n<|grounding|>OCR this nutrition label. Return JSON: {energy_kj, energy_kcal, protein_g, fat_g, carbs_g, fiber_g, sugar_g, sodium_mg, cholesterol_mg, saturated_fat_g, trans_fat_g, serving_label, serving_base_grams, product_name}. Set missing fields to 0. Return JSON only.`;

  console.log('提示词长度:', content.length, '字符\n');

  const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: content }],
      max_tokens: 2048,
      temperature: 0.05
    })
  });

  console.log('状态码:', response.status);

  if (!response.ok) {
    console.log('错误:', await response.text());
    return;
  }

  const result = JSON.parse(await response.text());
  const text = result.choices?.[0]?.message?.content;

  if (!text) {
    console.log('❌ 返回内容为空!');
    return;
  }

  console.log('✅ 成功!\n');
  console.log('原始响应:');
  console.log(text.substring(0, 500));

  // 解析 JSON
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('\n解析结果:');
      console.log(JSON.stringify(parsed, null, 2));
    }
  } catch (e) {
    console.log('\nJSON解析失败:', e.message);
  }
}

test().catch(console.error);
