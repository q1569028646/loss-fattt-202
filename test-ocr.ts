import * as fs from 'fs';
import * as path from 'path';
import { AIClient } from './src/services/ai/AIClient';
import { DEFAULT_PROVIDERS } from './src/services/ai/types';

async function testOCR() {
  try {
    const imagePath = path.join(__dirname, 'docs/plans/a23729648c204532cba2978ea4ecc58e.jpg');
    
    if (!fs.existsSync(imagePath)) {
      console.error('❌ 图片文件不存在:', imagePath);
      return;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    console.log('✅ 图片读取成功，大小:', imageBuffer.length, 'bytes');

    const provider = DEFAULT_PROVIDERS.find((p: { id: string }) => p.id === 'siliconflow-deepseek-ocr');
    if (!provider) {
      console.error('❌ 找不到 siliconflow-deepseek-ocr 配置');
      return;
    }

    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      console.error('❌ 请设置环境变量 SILICONFLOW_API_KEY');
      console.error('   例如: export SILICONFLOW_API_KEY=your-api-key');
      return;
    }

    const client = new AIClient({
      ...provider,
      apiKey,
    });

    console.log('🔄 正在调用 DeepSeek-OCR...');
    const result = await client.analyzeNutritionLabel(base64);
    
    console.log('\n✅ OCR 识别结果:');
    console.log(JSON.stringify(result, null, 2));

    if (result.error) {
      console.log('\n❌ 识别失败:', result.error);
    } else {
      console.log('\n🎉 识别成功!');
      console.log(`产品名称: ${result.product_name}`);
      console.log(`热量: ${result.energy_kcal} kcal (${result.energy_kj} kJ)`);
      console.log(`蛋白质: ${result.protein_g}g`);
      console.log(`脂肪: ${result.fat_g}g`);
      console.log(`碳水: ${result.carbs_g}g`);
    }

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('状态码:', error.status || error.statusCode);
    console.error('响应:', error.response?.data || error.response?.text || '无响应体');
  }
}

testOCR();
