const { chromium } = require('playwright');

const FRAMEWORK_NOISE = ['shadow*', 'pointerEvents', 'transform-origin', 'React Native'];
const ERROR_TEXT_PATTERNS = [
  'Uncaught Error',
  'is not defined',
  'Cannot read properties of',
  'Cannot read',
  'ReferenceError',
  'TypeError',
  'styles is not defined',
];

(async () => {
  const errors = [];
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (FRAMEWORK_NOISE.some(w => text.includes(w))) return;
      errors.push(`CONSOLE error: ${text}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`PAGE_ERROR: ${err.message}`);
  });

  try {
    console.log('=== Testing Home Page ===');
    await page.goto('http://localhost:8081', { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/home.png', fullPage: true });

    const overlayCount = await page.locator(
      '[class*="redbox"], [class*="ErrorOverlay"], [class*="error-boundary"]'
    ).count();
    if (overlayCount > 0) {
      errors.push('RENDER_ERROR: Error overlay visible on home page');
    }

    const bodyText = await page.locator('body').textContent();
    for (const pattern of ERROR_TEXT_PATTERNS) {
      if (bodyText && bodyText.includes(pattern)) {
        errors.push(`RENDER_ERROR: "${pattern}" found in home page text`);
      }
    }

    console.log('=== Testing Add Food Page ===');
    await page.goto('http://localhost:8081/(tabs)/add-food', { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/add-food.png', fullPage: true });

    const addFoodOverlay = await page.locator(
      '[class*="redbox"], [class*="ErrorOverlay"], [class*="error-boundary"]'
    ).count();
    if (addFoodOverlay > 0) {
      errors.push('RENDER_ERROR: Error overlay visible on add-food page');
    }

    const addFoodText = await page.locator('body').textContent();
    for (const pattern of ERROR_TEXT_PATTERNS) {
      if (addFoodText && addFoodText.includes(pattern)) {
        errors.push(`RENDER_ERROR on add-food: "${pattern}" in page text`);
      }
    }

    console.log('=== Testing Profile Page ===');
    await page.goto('http://localhost:8081/(tabs)/profile', { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/profile.png', fullPage: true });

    const profileOverlay = await page.locator(
      '[class*="redbox"], [class*="ErrorOverlay"], [class*="error-boundary"]'
    ).count();
    if (profileOverlay > 0) {
      errors.push('RENDER_ERROR: Error overlay visible on profile page');
    }

    const profileText = await page.locator('body').textContent();
    for (const pattern of ERROR_TEXT_PATTERNS) {
      if (profileText && profileText.includes(pattern)) {
        errors.push(`RENDER_ERROR on profile: "${pattern}" in page text`);
      }
    }

  } catch (error) {
    errors.push(`NAVIGATION_ERROR: ${error.message}`);
  }

  await browser.close();

  if (errors.length > 0) {
    console.error('FAILED:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  } else {
    console.log('PASSED - No errors detected on any page');
    process.exit(0);
  }
})();
