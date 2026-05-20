const fs = require('fs');
const path = require('path');

async function test() {
  const imagePath = path.join(__dirname, 'docs/plans/a23729648c204532cba2978ea4ecc58e.jpg');
  
  console.log('=== 检查图片文件 ===\n');
  
  const stats = fs.statSync(imagePath);
  console.log(`文件大小: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);
  
  const buffer = fs.readFileSync(imagePath);
  
  // 检查 JPEG 文件头
  console.log(`文件头 (前10字节): ${buffer.slice(0, 10).toString('hex')}`);
  console.log(`是否是JPEG: ${buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF ? '✅ 是' : '❌ 否'}`);
  
  // 尝试不同的 API 调用方式
  const apiKey = 'sk-wwwyzmertnkclikeqoyjmtdxobrhtwtjuwmrjztjljqjbaxe';
  const base64 = buffer.toString('base64');
  
  console.log(`\nBase64 长度: ${base64.length}`);
  
  // 测试 DeepSeek-OCR 的不同提示词
  const tests = [
    {
      name: '简短通用 OCR',
      content: `<image>\n<|grounding|>Free OCR.`
    },
    {
      name: '详细 OCR',
      content: `<image>\n<|grounding|>OCR this image and return all text content.`
    },
    {
      name: '文档转 Markdown',
      content: `<image>\n<|grounding|>Convert the document to markdown.`
    },
    {
      name: '表格解析',
      content: `<image>\n<|grounding|>Parse the figure.`
    },
    {
      name: '图像描述',
      content: `<image>\nDescribe this image in detail.`
    }
  ];

  console.log('\n=== 测试不同提示词 ===\n');
  
  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    
    try {
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-OCR',
          messages: [{
            role: 'user',
            content: test.content
          }],
          max_tokens: 2048,
          temperature: 0.05
        })
      });

      if (response.ok) {
        const result = JSON.parse(await response.text());
        const content = result.choices?.[0]?.message?.content;
        
        if (content) {
          console.log(`✅ 成功 (${content.length} 字符):`);
          console.log(content.substring(0, 300));
        } else {
          console.log(`❌ 返回为空`);
        }
      } else {
        console.log(`❌ ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      console.log(`❌ ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

test().catch(console.error);
