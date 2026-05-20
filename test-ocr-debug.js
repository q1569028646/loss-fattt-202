const fs = require('fs');
const path = require('path');

async function testDeepSeekOCR() {
  try {
    const imagePath = path.join(__dirname, 'docs/plans/a23729648c204532cba2978ea4ecc58e.jpg');
    
    if (!fs.existsSync(imagePath)) {
      console.error('❌ 图片文件不存在:', imagePath);
      return;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    console.log('✅ 图片读取成功，大小:', imageBuffer.length, 'bytes');
    console.log('Base64长度:', base64.length, '字符');

    const apiKey = 'sk-wwwyzmertnkclikeqoyjmtdxobrhtwtjuwmrjztjljqjbaxe';

    // 测试 1: 使用当前实现的消息格式
    console.log('\n=== 测试 1: 当前实现的消息格式 ===');
    
    const requestBody1 = {
      model: 'deepseek-ai/DeepSeek-OCR',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64}`
              }
            },
            {
              type: 'text',
              text: `<image>
<|grounding|>OCR this nutrition facts label and extract all data into a strictly valid JSON object with these exact fields:
- energy_kj: number (0 if not shown)
- energy_kcal: number (0 if not shown, convert from kJ if needed: kcal = kJ ÷ 4.184)
- protein_g: number
- fat_g: number
- carbs_g: number
- fiber_g: number (0 if not shown)
- sugar_g: number (0 if not shown)
- sodium_mg: number (0 if not shown)
- cholesterol_mg: number (0 if not shown)
- saturated_fat_g: number (0 if not shown)
- trans_fat_g: number (0 if not shown)
- serving_label: string (e.g., "每100g", "per 100g")
- serving_base_grams: number (usually 100)
- product_name: string (product name if readable, otherwise "未知产品")
- error: string (only if image is not a nutrition label)

Rules:
- Extract exact numbers from the label. Do NOT estimate.
- If energy is in kJ, also calculate kcal. If in kcal, also calculate kJ.
- If a field is not on the label, set it to 0.
- Return ONLY the JSON object, no markdown formatting, no explanation.`
            }
          ]
        }
      ],
      max_tokens: 2048,
      temperature: 0.05
    };

    console.log('请求体大小:', JSON.stringify(requestBody1).length, '字符');

    const response1 = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody1)
    });

    console.log('状态码:', response1.status);
    const responseText1 = await response1.text();
    console.log('响应体:', responseText1.substring(0, 2000));

    if (response1.ok) {
      const result1 = JSON.parse(responseText1);
      console.log('\n✅ 测试 1 成功!');
      console.log('内容:', result1.choices?.[0]?.message?.content?.substring(0, 500));
    } else {
      console.error('\n❌ 测试 1 失败');
    }

    // 测试 2: 使用 system + user 消息格式
    console.log('\n=== 测试 2: system + user 消息格式 ===');
    
    const requestBody2 = {
      model: 'deepseek-ai/DeepSeek-OCR',
      messages: [
        {
          role: 'system',
          content: 'You are a precise nutrition label OCR engine.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64}`
              }
            },
            {
              type: 'text',
              text: '<image>\n<|grounding|>OCR this nutrition facts label and extract all data into a JSON object.'
            }
          ]
        }
      ],
      max_tokens: 2048,
      temperature: 0.05
    };

    const response2 = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody2)
    });

    console.log('状态码:', response2.status);
    const responseText2 = await response2.text();
    console.log('响应体:', responseText2.substring(0, 2000));

    if (response2.ok) {
      const result2 = JSON.parse(responseText2);
      console.log('\n✅ 测试 2 成功!');
      console.log('内容:', result2.choices?.[0]?.message?.content?.substring(0, 500));
    } else {
      console.error('\n❌ 测试 2 失败');
    }

    // 测试 3: 使用纯文本消息格式（不带 content 数组）
    console.log('\n=== 测试 3: 纯文本消息格式 ===');
    
    const requestBody3 = {
      model: 'deepseek-ai/DeepSeek-OCR',
      messages: [
        {
          role: 'user',
          content: `<image>
<|grounding|>OCR this nutrition facts label and extract all data into a JSON object.`
        }
      ],
      max_tokens: 2048,
      temperature: 0.05
    };

    const response3 = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody3)
    });

    console.log('状态码:', response3.status);
    const responseText3 = await response3.text();
    console.log('响应体:', responseText3.substring(0, 2000));

    if (response3.ok) {
      const result3 = JSON.parse(responseText3);
      console.log('\n✅ 测试 3 成功!');
      console.log('内容:', result3.choices?.[0]?.message?.content?.substring(0, 500));
    } else {
      console.error('\n❌ 测试 3 失败');
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

testDeepSeekOCR();
