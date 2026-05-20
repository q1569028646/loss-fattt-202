const fs = require('fs');
const path = require('path');

async function test() {
  const imagePath = path.join(__dirname, 'docs/plans/a23729648c204532cba2978ea4ecc58e.jpg');
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');

  const apiKey = 'sk-wwwyzmertnkclikeqoyjmtdxobrhtwtjuwmrjztjljqjbaxe';

  console.log('=== 深度调试 DeepSeek-OCR 响应 ===\n');
  console.log('图片大小:', imageBuffer.length, 'bytes');
  console.log('Base64长度:', base64.length, '字符\n');

  // 测试不同的请求方式
  const tests = [
    {
      name: '方式1: 纯文本 <image> 标记（简短提示）',
      body: {
        model: 'deepseek-ai/DeepSeek-OCR',
        messages: [{
          role: 'user',
          content: `<image>\n<|grounding|>OCR this image.`
        }],
        max_tokens: 2048,
        temperature: 0.05
      }
    },
    {
      name: '方式2: 纯文本 <image> 标记（详细提示）',
      body: {
        model: 'deepseek-ai/DeepSeek-OCR',
        messages: [{
          role: 'user',
          content: `<image>\n<|grounding|>OCR this nutrition facts label and extract all data into JSON with fields: energy_kcal, protein_g, fat_g, carbs_g, sodium_mg.`
        }],
        max_tokens: 2048,
        temperature: 0.05
      }
    },
    {
      name: '方式3: 纯文本（无 <image> 标记）',
      body: {
        model: 'deepseek-ai/DeepSeek-OCR',
        messages: [{
          role: 'user',
          content: `OCR this nutrition facts label image and extract nutritional data.`
        }],
        max_tokens: 2048,
        temperature: 0.05
      }
    },
    {
      name: '方式4: 使用图片 URL + 文本（数组格式）',
      body: {
        model: 'deepseek-ai/DeepSeek-OCR',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64}` }
            },
            {
              type: 'text',
              text: 'OCR this nutrition label and return JSON with energy_kcal, protein_g, fat_g, carbs_g.'
            }
          ]
        }],
        max_tokens: 2048,
        temperature: 0.05
      }
    },
    {
      name: '方式5: Kimi-K2.5 参考格式（数组 + 系统提示）',
      body: {
        model: 'moonshotai/Kimi-K2.5',
        messages: [
          {
            role: 'system',
            content: 'You are a nutrition label OCR engine.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64}` }
              }
            ]
          }
        ],
        max_tokens: 1024,
        temperature: 0.05,
        response_format: { type: 'json_object' }
      }
    }
  ];

  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`测试: ${test.name}`);
    console.log('='.repeat(60));

    try {
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(test.body)
      });

      console.log('状态码:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('错误响应:', errorText.substring(0, 500));
        continue;
      }

      const result = JSON.parse(await response.text());

      console.log('模型:', result.model);
      console.log('Finish reason:', result.choices?.[0]?.finish_reason);
      console.log('Usage:', JSON.stringify(result.usage));

      const content = result.choices?.[0]?.message?.content;
      console.log('Content 长度:', content?.length || 0);
      console.log('Content 是否为空:', !content ? '❌ 是空' : '✅ 有内容');
      console.log('Content 前300字符:');
      console.log(content?.substring(0, 300) || '(空)');

    } catch (error) {
      console.log('请求错误:', error.message);
    }

    // 每个测试之间暂停
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

test().catch(console.error);
