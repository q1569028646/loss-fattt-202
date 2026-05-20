const fs = require('fs');
const path = require('path');

async function test() {
  const imagePath = path.join(__dirname, 'docs/plans/a23729648c204532cba2978ea4ecc58e.jpg');
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');

  const apiKey = 'sk-wwwyzmertnkclikeqoyjmtdxobrhtwtjuwmrjztjljqjbaxe';
  const model = 'deepseek-ai/DeepSeek-OCR';

  console.log('=== 简单直接测试 ===\n');
  console.log('API:', apiKey.substring(0, 15) + '...');
  console.log('Model:', model);
  console.log('图片大小:', imageBuffer.length, 'bytes\n');

  // 方式: 直接用最简单的格式
  const requestBody = {
    model: model,
    messages: [
      {
        role: 'user',
        content: `<image>\n<|grounding|>Convert the document to markdown.`
      }
    ],
    max_tokens: 2048,
    temperature: 0.05
  };

  console.log('请求体:');
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('\n发送请求...\n');

  const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  console.log('状态码:', response.status);
  console.log('状态文本:', response.statusText);

  const result = await response.text();
  console.log('\n完整响应:');
  console.log(result);
}

test().catch(console.error);
