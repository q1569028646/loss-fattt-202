const fs = require('fs');
const path = require('path');

async function test() {
  const apiKey = 'sk-wwwyzmertnkclikeqoyjmtdxobrhtwtjuwmrjztjljqjbaxe';
  const model = 'deepseek-ai/DeepSeek-OCR';

  console.log('=== 测试从 Markdown 表格提取数据 ===\n');

  // 使用 Convert to markdown
  const content = `<image>\n<|grounding|>Convert the document to markdown.`;

  console.log('提示词:', content, '\n');

  const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: content }],
      max_tokens: 4096,
      temperature: 0.05
    })
  });

  console.log('状态码:', response.status);

  if (response.ok) {
    const result = JSON.parse(await response.text());
    const text = result.choices?.[0]?.message?.content;
    
    console.log('\n原始响应:');
    console.log(text);

    // 尝试解析 Markdown 表格
    console.log('\n\n尝试解析表格...');
    
    // 提取表格行
    const rows = text.match(/\|[^|]+\|/g);
    if (rows && rows.length > 0) {
      console.log('找到', rows.length, '行');
      rows.forEach((row, i) => {
        console.log(`行${i}:`, row);
      });
    }
  }
}

test().catch(console.error);
