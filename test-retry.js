const fs = require('fs');
const path = require('path');

async function test() {
  const apiKey = 'sk-wwwyzmertnkclikeqoyjmtdxobrhtwtjuwmrjztjljqjbaxe';
  const model = 'deepseek-ai/DeepSeek-OCR';

  console.log('=== 多次测试寻找稳定的提示词 ===\n');

  const prompts = [
    { name: '表格解析', content: `<image>\n<|grounding|>Parse the figure.` },
    { name: '图表描述', content: `<image>\n<|grounding|>Describe the chart and extract all numbers.` },
    { name: '图像到文本', content: `<image>\n<|grounding|>Image to text.` },
    { name: 'OCR数字', content: `<image>\n<|grounding|>OCR all numbers from this image.` },
  ];

  for (const prompt of prompts) {
    console.log(`\n--- ${prompt.name} ---`);
    
    try {
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt.content }],
          max_tokens: 4096,
          temperature: 0.05
        })
      });

      if (response.ok) {
        const result = JSON.parse(await response.text());
        const text = result.choices?.[0]?.message?.content;
        console.log('结果:', text?.substring(0, 300) || '(空)');
      } else {
        console.log('错误:', await response.text());
      }
    } catch (e) {
      console.log('异常:', e.message);
    }

    await new Promise(r => setTimeout(r, 1000));
  }
}

test().catch(console.error);
