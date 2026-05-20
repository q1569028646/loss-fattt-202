const fs = require('fs');
const path = require('path');

async function test() {
  const imagePath = path.join(__dirname, 'docs/plans/a23729648c204532cba2978ea4ecc58e.jpg');
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');

  const apiKey = 'sk-wwwyzmertnkclikeqoyjmtdxobrhtwtjuwmrjztjljqjbaxe';

  console.log('=== 模拟 App 完整流程 ===\n');

  // 模拟 App 中的提供商配置
  const providerConfigs = [
    {
      name: '硅基流动-DeepSeek-OCR（预设）',
      config: {
        id: 'siliconflow-deepseek-ocr',
        name: '硅基流动-DeepSeek-OCR',
        baseURL: 'https://api.siliconflow.cn/v1',
        models: {
          vision: 'deepseek-ai/DeepSeek-VL2',
          ocr: 'deepseek-ai/DeepSeek-OCR',
          chat: 'deepseek-ai/DeepSeek-V3',
        }
      }
    },
    {
      name: '硅基流动（用户自定义OCR为DeepSeek-OCR）',
      config: {
        id: 'siliconflow',
        name: '硅基流动',
        baseURL: 'https://api.siliconflow.cn/v1',
        models: {
          vision: 'Qwen/Qwen2-VL-72B-Instruct',
          ocr: 'deepseek-ai/DeepSeek-OCR',  // 用户自定义
          chat: 'Qwen/Qwen2.5-72B-Instruct',
        }
      }
    },
    {
      name: '硅基流动（默认Qwen模型）',
      config: {
        id: 'siliconflow',
        name: '硅基流动',
        baseURL: 'https://api.siliconflow.cn/v1',
        models: {
          vision: 'Qwen/Qwen2-VL-72B-Instruct',
          ocr: 'Qwen/Qwen2-VL-72B-Instruct',  // 默认
          chat: 'Qwen/Qwen2.5-72B-Instruct',
        }
      }
    }
  ];

  for (const { name, config } of providerConfigs) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`测试: ${name}`);
    console.log(`OCR模型: ${config.models.ocr}`);
    console.log('='.repeat(60));

    // 检测逻辑（和 App 代码一致）
    const isDeepSeekOCR = config.models.ocr.toLowerCase().includes('deepseek') && 
                          config.models.ocr.toLowerCase().includes('ocr');
    
    console.log(`检测结果: ${isDeepSeekOCR ? '✅ DeepSeek-OCR 专用' : '❌ 通用方案'}`);

    // 根据检测结果构造请求
    let requestBody;
    if (isDeepSeekOCR) {
      requestBody = {
        model: config.models.ocr,
        messages: [{
          role: 'user',
          content: `<image>\n<|grounding|>OCR this nutrition facts label and extract all data into a strictly valid JSON object with these exact fields:\n- energy_kj: number\n- energy_kcal: number\n- protein_g: number\n- fat_g: number\n- carbs_g: number\n- error: string`
        }],
        max_tokens: 2048,
        temperature: 0.05
      };
    } else {
      requestBody = {
        model: config.models.ocr,
        messages: [
          { role: 'system', content: 'You are a nutrition label OCR engine.' },
          {
            role: 'user',
            content: [{
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64}` }
            }]
          }
        ],
        max_tokens: 1024,
        temperature: 0.05,
        response_format: { type: 'json_object' }
      };
    }

    try {
      const response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`状态码: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        console.log(`❌ 错误: ${error.substring(0, 300)}`);
        continue;
      }

      const result = JSON.parse(await response.text());
      const content = result.choices?.[0]?.message?.content;

      if (content) {
        console.log(`✅ 成功! 内容前200字符:`);
        console.log(content.substring(0, 200));
      } else {
        console.log(`❌ 返回内容为空!`);
        console.log(`Finish reason: ${result.choices?.[0]?.finish_reason}`);
        console.log(`Usage: ${JSON.stringify(result.usage)}`);
      }

    } catch (error) {
      console.log(`❌ 请求异常: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
  }
}

test().catch(console.error);
