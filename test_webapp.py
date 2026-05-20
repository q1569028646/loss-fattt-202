from playwright.sync_api import sync_playwright
import sys

errors_found = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    page.on("console", lambda msg: errors_found.append(f"CONSOLE {msg.type}: {msg.text}") if msg.type in ["error", "warning"] else None)
    page.on("pageerror", lambda err: errors_found.append(f"PAGE_ERROR: {err}"))

    page.goto("http://localhost:8081", timeout=60000)
    page.wait_for_load_state("networkidle", timeout=60000)
    page.wait_for_timeout(3000)

    page.screenshot(path="/tmp/nutriflow_home.png", full_page=True)
    print("Screenshot saved to /tmp/nutriflow_home.png")

    current_url = page.url
    print(f"Current URL: {current_url}")

    tabs = page.locator('[role="tab"], [data-testid="tab"]').all()
    print(f"Found {len(tabs)} tab elements")

    nav_links = page.locator("a").all()
    print(f"Found {len(nav_links)} navigation links")

    page.screenshot(path="/tmp/nutriflow_state1.png", full_page=True)

    settings_link = None
    for link in nav_links:
        text = link.text_content() or ""
        href = link.get_attribute("href") or ""
        if "设置" in text or "settings" in href.lower():
            settings_link = link
            break

    if settings_link:
        settings_link.click()
        page.wait_for_load_state("networkidle", timeout=30000)
        page.wait_for_timeout(2000)
        page.screenshot(path="/tmp/nutriflow_settings.png", full_page=True)
        print("Navigated to settings page")

        page_content = page.content()
        if "AI 服务商" in page_content:
            print("Found 'AI 服务商' section on settings page")
        if "自定义模型" in page_content:
            print("Found '自定义模型' toggle on settings page")

            model_toggle = page.locator("text=自定义模型")
            if model_toggle.count() > 0:
                model_toggle.first.click()
                page.wait_for_timeout(1000)
                page.screenshot(path="/tmp/nutriflow_settings_models.png", full_page=True)

                page_content = page.content()
                if "视觉模型" in page_content:
                    print("Found vision model section")
                if "OCR模型" in page_content or "OCR" in page_content:
                    print("Found OCR model section")
                if "对话模型" in page_content:
                    print("Found chat model section")

                ocr_found = "OCR模型" in page_content or ("OCR" in page_content and "营养标签" in page_content)
                print(f"OCR model config visible: {ocr_found}")
        else:
            print("Model config section not visible (need to expand)")
    else:
        print("Settings link not found, trying direct navigation")
        page.goto("http://localhost:8081/settings", timeout=30000)
        page.wait_for_load_state("networkidle", timeout=30000)
        page.wait_for_timeout(2000)
        page.screenshot(path="/tmp/nutriflow_settings_direct.png", full_page=True)

    add_food_link = None
    for link in nav_links:
        text = link.text_content() or ""
        href = link.get_attribute("href") or ""
        if "添加" in text or "add" in href.lower():
            add_food_link = link
            break

    if add_food_link:
        add_food_link.click()
        page.wait_for_load_state("networkidle", timeout=30000)
        page.wait_for_timeout(2000)
        page.screenshot(path="/tmp/nutriflow_add_food.png", full_page=True)
        print("Navigated to add food page")

        page_content = page.content()
        if "识别营养标签" in page_content:
            print("Found '识别营养标签' section on add food page")
        else:
            print("Nutrition label section not found on add food page")
    else:
        print("Add food link not found")

    browser.close()

print("\n=== ERROR REPORT ===")
if errors_found:
    for e in errors_found:
        print(e)
    print(f"\nTotal errors/warnings: {len(errors_found)}")
    sys.exit(1)
else:
    print("No console errors or page errors detected!")
    sys.exit(0)
