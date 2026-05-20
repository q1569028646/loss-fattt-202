const fs = require('fs');
const path = require('path');

async function testDebug() {
  try {
    const imagePath = path.join(__dirname, 'docs/plans/a23729648c204532cba2978ea4ecc58e.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');

    const apiKey = 'sk-wwwyzmertnkclikeqoyjmtdxobrhtwtjuwmrjztjljqjbaxe';

    console.log('=== 调试：检查完整响应 ===');
    
    const requestBody = {
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

    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('状态码:', response.status);
    console.log('响应头:', JSON.stringify(Object.fromEntries(response.headers)));
    
    const responseText = await response.text();
    console.log('完整响应体:');
    console.log(responseText);

    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('\n解析后的结果:');
      console.log(JSON.stringify(result, null, 2));
      
      console.log('\nChoices:', result.choices);
      console.log('Content:', result.choices?.[0]?.message?.content);
      console.log('Finish reason:', result.choices?.[0]?.finish_reason);
    }

  } catch (error) {
    console.error('错误:', error.message);
  }
}

testDebug();
