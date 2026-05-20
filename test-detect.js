const fs = require('fs');
const path = require('path');

async function test() {
  const testCases = [
    'deepseek-ai/DeepSeek-OCR',
    'deepseek-ai/DeepSeek-VL2',
    'Qwen/Qwen2-VL-72B-Instruct',
    'qwen-vl-max',
    'deepseek-chat',
  ];

  console.log('=== 测试 DeepSeek-OCR 检测逻辑 ===\n');

  testCases.forEach(model => {
    const oldLogic = model.toLowerCase().includes('deepseek-ocr');
    const newLogic = model.toLowerCase().includes('deepseek') && model.toLowerCase().includes('ocr');
    
    console.log(`模型: ${model}`);
    console.log(`  旧逻辑 (includes 'deepseek-ocr'): ${oldLogic ? '✅ 是' : '❌ 否'}`);
    console.log(`  新逻辑 (includes 'deepseek' && 'ocr'): ${newLogic ? '✅ 是' : '❌ 否'}`);
    console.log('');
  });

  // 实际测试 API 调用
  console.log('\n=== 实际 API 测试 ===\n');
  
  const imagePath = path.join(__dirname, 'docs/plans/a23729648c204532cba2978ea4ecc58e.jpg');
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');

  const apiKey = 'sk-wwwyzmertnkclikeqoyjmtdxobrhtwtjuwmrjztjljqjbaxe';
  const model = 'deepseek-ai/DeepSeek-OCR';

  // 新逻辑检测
  const isDeepSeekOCR = model.toLowerCase().includes('deepseek') && model.toLowerCase().includes('ocr');
  console.log(`检测结果: ${isDeepSeekOCR ? '✅ 使用 DeepSeek-OCR 专用方案' : '❌ 使用通用方案'}`);

  if (isDeepSeekOCR) {
    console.log('\n发送请求...\n');
    
    const requestBody = {
      model: model,
      messages: [
        {
          role: 'user',
          content: `<image>
<|grounding|>OCR this nutrition facts label and extract all data into a JSON object with these fields:
- energy_kcal: number
- protein_g: number
- fat_g: number
- carbs_g: number
- product_name: string`,
        }
      ],
      max_tokens: 2048,
      temperature: 0.05
    };

    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('状态码:', response.status);
    
    if (response.ok) {
      const result = JSON.parse(await response.text());
      const content = result.choices?.[0]?.message?.content;
      
      if (content) {
        console.log('✅ 成功! 内容前 200 字符:');
        console.log(content.substring(0, 200));
      } else {
        console.log('❌ 返回内容为空');
      }
    } else {
      console.log('❌ 请求失败');
    }
  }
}

test().catch(console.error);
