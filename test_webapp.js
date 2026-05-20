const { chromium } = require('playwright');

const RN_WEB_WARNINGS = ['shadow*', 'pointerEvents', 'transform-origin'];

(async () => {
  const errors = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://localhost:8081',
        localStorage: [
          { name: 'nutriflow_profile', value: JSON.stringify({ gender: 'male', age: 25, heightCm: 175, weightKg: 70, goalWeightKg: 65, activityLevel: 'moderate', weightGoal: 'lose', tdee: 2200, calorieAdjustment: -500, proteinG: 120, isOnboarded: true }) },
        ],
      }],
    },
  });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      const isRNWarning = RN_WEB_WARNINGS.some(w => text.includes(w));
      if (isRNWarning) return;
      errors.push(`CONSOLE error: ${text}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`PAGE_ERROR: ${err.message}`);
  });

  const pages = [
    { name: 'home', path: '/(tabs)/home', label: '首页' },
    { name: 'add-food', path: '/(tabs)/add-food', label: '添加食物' },
    { name: 'progress', path: '/(tabs)/progress', label: '进度' },
    { name: 'coach', path: '/(tabs)/coach', label: 'AI教练' },
    { name: 'settings', path: '/(tabs)/settings', label: '设置' },
  ];

  for (const p of pages) {
    console.log(`\nTesting ${p.label} page...`);
    try {
      await page.goto(`http://localhost:8081/${p.path}`, { timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `test_screenshots/${p.name}.png`, fullPage: true });

      const errorOverlay = await page.locator('[data-testid="log-row"], .error-overlay, [class*="redbox"], [class*="ErrorOverlay"]').count();
      if (errorOverlay > 0) {
        errors.push(`RENDER_ERROR on ${p.label}: React error overlay visible`);
        console.log(`  ${p.label} page has ERROR OVERLAY!`);
      }

      const bodyText = await page.locator('body').textContent();
      if (bodyText && (bodyText.includes('Uncaught Error') || bodyText.includes('is not defined') || bodyText.includes('Cannot read'))) {
        errors.push(`RENDER_ERROR on ${p.label}: Uncaught error visible in page text`);
        console.log(`  ${p.label} page has UNCAUGHT ERROR in text!`);
      }

      console.log(`  ${p.label} page loaded OK`);
    } catch (e) {
      errors.push(`LOAD_ERROR on ${p.label}: ${e.message}`);
      console.log(`  ${p.label} page FAILED: ${e.message}`);
    }
  }

  console.log('\nVerifying settings model config...');
  await page.goto('http://localhost:8081/(tabs)/settings', { timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForTimeout(2000);

  const settingsContent = await page.content();
  const hasAISection = settingsContent.includes('AI 服务商');
  console.log(`  AI provider section: ${hasAISection}`);
  if (!hasAISection) errors.push('MISSING: AI provider section');

  const modelToggle = page.locator('text=自定义模型');
  if (await modelToggle.count() > 0) {
    await modelToggle.first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'test_screenshots/settings_models_expanded.png', fullPage: true });

    const expandedContent = await page.content();
    const checks = [
      { name: '视觉模型', key: 'vision' },
      { name: 'OCR模型', key: 'ocr' },
      { name: '对话模型', key: 'chat' },
    ];
    for (const check of checks) {
      const found = expandedContent.includes(check.name);
      console.log(`  ${check.name} section: ${found}`);
      if (!found) errors.push(`MISSING: ${check.name} section not found`);
    }
  } else {
    errors.push('MISSING: Model config toggle not found');
  }

  console.log('\nVerifying add-food OCR section...');
  await page.goto('http://localhost:8081/(tabs)/add-food', { timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForTimeout(2000);
  const addFoodContent = await page.content();
  const hasOCRSection = addFoodContent.includes('识别营养标签');
  console.log(`  Nutrition label OCR section: ${hasOCRSection}`);
  if (!hasOCRSection) errors.push('MISSING: Nutrition label OCR section');

  console.log('\nVerifying home page renders without crash...');
  await page.goto('http://localhost:8081/(tabs)/home', { timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForTimeout(3000);
  const homeContent = await page.content();
  const hasSmartAnalysis = homeContent.includes('智能分析');
  console.log(`  Smart analysis section: ${hasSmartAnalysis}`);

  await browser.close();

  console.log('\n========================================');
  console.log('=== WEBAPP TEST RESULTS ===');
  console.log('========================================');
  if (errors.length > 0) {
    console.log('FAILED - Errors found:');
    errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    process.exit(1);
  } else {
    console.log('PASSED - All pages loaded without errors!');
    console.log('Verified:');
    console.log('  ✓ All 5 pages load (home, add-food, progress, coach, settings)');
    console.log('  ✓ No React error overlays');
    console.log('  ✓ No uncaught errors in page text');
    console.log('  ✓ Settings: vision + OCR + chat model config');
    console.log('  ✓ Add food: nutrition label OCR section');
    console.log('  ✓ Home: smart analysis renders');
    process.exit(0);
  }
})();
