const fs = require('fs');
const path = require('path');

async function testFixedOCR() {
  try {
    const imagePath = path.join(__dirname, 'docs/plans/a23729648c204532cba2978ea4ecc58e.jpg');
    
    if (!fs.existsSync(imagePath)) {
      console.error('❌ 图片文件不存在:', imagePath);
      return;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    console.log('✅ 图片读取成功，大小:', imageBuffer.length, 'bytes');

    const apiKey = 'sk-wwwyzmertnkclikeqoyjmtdxobrhtwtjuwmrjztjljqjbaxe';

    // 使用修复后的格式：纯文本 content
    console.log('\n=== 测试修复后的 DeepSeek-OCR ===');
    
    const requestBody = {
      model: 'deepseek-ai/DeepSeek-OCR',
      messages: [
        {
          role: 'user',
          content: `<image>
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
    const responseText = await response.text();

    if (!response.ok) {
      console.error('❌ 请求失败:', responseText);
      return;
    }

    const result = JSON.parse(responseText);
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('❌ 返回内容为空');
      return;
    }

    console.log('\n✅ 识别成功!');
    console.log('\n原始响应:');
    console.log(content.substring(0, 1000));

    // 尝试解析 JSON
    let parsed;
    try {
      // 尝试直接解析
      parsed = JSON.parse(content);
    } catch {
      // 尝试从代码块中提取
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        try {
          parsed = JSON.parse(codeBlockMatch[1].trim());
        } catch {
          // 忽略
        }
      }
      
      // 尝试匹配 JSON 对象
      if (!parsed) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch {
            // 忽略
          }
        }
      }
    }

    if (parsed) {
      console.log('\n📊 解析结果:');
      console.log(`产品名称: ${parsed.product_name || '未识别'}`);
      console.log(`热量: ${parsed.energy_kcal || 0} kcal (${parsed.energy_kj || 0} kJ)`);
      console.log(`蛋白质: ${parsed.protein_g || 0}g`);
      console.log(`脂肪: ${parsed.fat_g || 0}g`);
      console.log(`碳水: ${parsed.carbs_g || 0}g`);
      console.log(`膳食纤维: ${parsed.fiber_g || 0}g`);
      console.log(`糖: ${parsed.sugar_g || 0}g`);
      console.log(`钠: ${parsed.sodium_mg || 0}mg`);
      console.log(`胆固醇: ${parsed.cholesterol_mg || 0}mg`);
      console.log(`饱和脂肪: ${parsed.saturated_fat_g || 0}g`);
      console.log(`反式脂肪: ${parsed.trans_fat_g || 0}g`);
      console.log(`份量: ${parsed.serving_label || ''} (${parsed.serving_base_grams || 100}g)`);
    } else {
      console.log('\n⚠️ 无法解析为 JSON，但 OCR 成功返回了文本');
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  }
}

testFixedOCR();
