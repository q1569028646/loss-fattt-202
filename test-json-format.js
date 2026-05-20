const fs = require('fs');
const path = require('path');

async function test() {
  const apiKey = 'sk-wwwyzmertnkclikeqoyjmtdxobrhtwtjuwmrjztjljqjbaxe';
  const model = 'deepseek-ai/DeepSeek-OCR';

  console.log('=== 测试不同 JSON 格式提示词 ===\n');

  const tests = [
    {
      name: '直接要JSON',
      content: `<image>\n<|grounding|>Return this JSON: {"energy_kcal": 0, "protein_g": 0}`
    },
    {
      name: '明确说JSON',
      content: `<image>\n<|grounding|>OCR this nutrition label and return valid JSON like {"energy_kcal": 100, "protein_g": 5}`
    },
    {
      name: '只返回JSON',
      content: `<image>\n<|grounding|>OCR. Return only valid JSON: {energy_kcal: number, protein_g: number}`
    },
    {
      name: '明确JSON格式',
      content: `<image>\n<|grounding|>Return pure JSON without markdown. {"a":1}`
    },
    {
      name: 'Free OCR',
      content: `<image>\nFree OCR.`
    }
  ];

  for (const test of tests) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`测试: ${test.name}`);
    console.log('='.repeat(50));

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

    if (response.ok) {
      const result = JSON.parse(await response.text());
      const text = result.choices?.[0]?.message?.content;
      console.log('Content:', text?.substring(0, 200) || '(空)');
      
      // 检查是否是有效 JSON
      try {
        JSON.parse(text);
        console.log('✅ 是有效 JSON!');
      } catch {
        // 尝试提取 JSON
        const m = text?.match(/\{[\s\S]*\}/);
        if (m) {
          try {
            JSON.parse(m[0]);
            console.log('✅ 可提取有效 JSON');
          } catch {}
        }
        console.log('❌ 不是有效 JSON');
      }
    } else {
      console.log('错误:', await response.text());
    }

    await new Promise(r => setTimeout(r, 500));
  }
}

test().catch(console.error);
