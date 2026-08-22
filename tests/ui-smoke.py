import os
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright


base_url = os.environ.get("JARGON_ARENA_URL", "http://127.0.0.1:4183")
artifact_dir = Path(tempfile.gettempdir()) / "jargon-arena-artifacts"
artifact_dir.mkdir(parents=True, exist_ok=True)
screen_shot = artifact_dir / "mobile.png"
result_screen_shot = artifact_dir / "result.png"


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 375, "height": 812}, device_scale_factor=1)
    console_errors = []
    page.on("pageerror", lambda error: console_errors.append(str(error)))
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
    page.goto(base_url, wait_until="networkidle")

    assert page.title() == "黑话段位局｜互联网黑话测试"
    page.get_by_role("button", name="开始测试").click()

    seen_categories = []
    for question_index in range(10):
        seen_categories.append(page.locator("#question-category").inner_text())
        options = page.locator(".option-button")
        assert options.count() == 4

        if question_index == 0:
            options.first.focus()
            options.first.press("ArrowDown")
        else:
            options.nth(question_index % 4).click()

        assert page.locator("#next-button").is_enabled()
        page.locator("#next-button").click()

    assert page.locator("#result-screen").is_visible()
    assert int(page.locator("#result-score").inner_text()) <= 100
    assert page.locator(".result-prescription").is_visible()
    page.screenshot(path=str(result_screen_shot), full_page=True)

    page.get_by_role("button", name="查看解析").click()
    assert page.locator(".explanation-item").count() == 10
    page.locator("#next-button").dispatch_event("click")
    assert page.locator(".explanation-item").count() == 10

    assert seen_categories == ["职场黑话"] * 4 + ["网络梗"] * 2 + ["语境判断"] * 2 + ["反黑话翻译"] * 2
    page.get_by_role("button", name="再测一次").click()
    assert page.locator("#question-counter").inner_text() == "01 / 10"
    assert page.locator("body").evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    page.screenshot(path=str(screen_shot), full_page=True)

    page.set_viewport_size({"width": 320, "height": 568})
    page.reload(wait_until="networkidle")
    assert page.locator("#intro-screen").is_visible()
    assert page.locator("body").evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    assert not console_errors, console_errors
    browser.close()

print(f"UI smoke test passed. Screenshots: {screen_shot}, {result_screen_shot}")
