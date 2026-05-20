const fs = require('fs');
const path = require('path');

async function testAppFlow() {
  console.log('=== 模拟 App 完整 OCR 流程 ===\n');

  const imagePath = path.join(__dirname, 'docs/plans/a23729648c204532cba2978ea4ecc58e.jpg');
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');

  console.log('图片大小:', imageBuffer.length, 'bytes\n');

  const DEFAULT_API_KEY = 'sk-wwwyzmertnkclikeqoyjmtdxobrhtwtjuwmrjztjljqjbaxe';

  const provider = {
    id: 'siliconflow-deepseek-ocr',
    name: '硅基流动-DeepSeek-OCR',
    baseURL: 'https://api.siliconflow.cn/v1',
    apiKey: DEFAULT_API_KEY,
    models: {
      vision: 'deepseek-ai/DeepSeek-VL2',
      ocr: 'deepseek-ai/DeepSeek-OCR',
      chat: 'deepseek-ai/DeepSeek-V3',
    },
  };

  console.log('使用配置:');
  console.log('- 提供商:', provider.name);
  console.log('- API:', provider.apiKey.substring(0, 15) + '...');
  console.log('- OCR模型:', provider.models.ocr);
  console.log('- BaseURL:', provider.baseURL);
  console.log('');

  const isDeepSeekOCR = provider.models.ocr.toLowerCase().includes('deepseek') && 
                        provider.models.ocr.toLowerCase().includes('ocr');

  console.log('检测结果:', isDeepSeekOCR ? '✅ DeepSeek-OCR 专用' : '❌ 通用方案');
  console.log('');

  const requestBody = {
    model: provider.models.ocr,
    messages: [
      {
        role: 'user',
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
- Return ONLY the JSON object, no markdown formatting, no explanation.`,
      },
    ],
    max_tokens: 2048,
    temperature: 0.05,
  };

  console.log('发送请求...\n');

  const response = await fetch(`${provider.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  console.log('状态码:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.log('❌ 错误:', error);
    return;
  }

  const result = JSON.parse(await response.text());
  const content = result.choices?.[0]?.message?.content;

  if (!content) {
    console.log('❌ 返回内容为空!');
    console.log('Finish reason:', result.choices?.[0]?.finish_reason);
    console.log('Usage:', JSON.stringify(result.usage));
    return;
  }

  console.log('✅ 成功!\n');
  console.log('原始响应:');
  console.log(content.substring(0, 500));

  // 解析 JSON
  try {
    let parsed;
    
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      parsed = JSON.parse(codeBlockMatch[1].trim());
    } else {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(content);
      }
    }

    console.log('\n解析结果:');
    console.log(JSON.stringify(parsed, null, 2));

    if (parsed.error) {
      console.log('\n❌ 识别失败:', parsed.error);
    } else {
      console.log('\n🎉 识别成功!');
    }
  } catch (e) {
    console.log('\n❌ JSON 解析失败:', e.message);
  }
}

testAppFlow().catch(console.error);
