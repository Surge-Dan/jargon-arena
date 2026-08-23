import os
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright


base_url = os.environ.get("JARGON_ARENA_URL", "http://127.0.0.1:4183")
artifact_dir = Path(tempfile.gettempdir()) / "jargon-arena-artifacts"
artifact_dir.mkdir(parents=True, exist_ok=True)


def assert_mobile_layout(page):
    assert page.locator("body").evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    assert page.locator(".topbar").evaluate("node => node.getBoundingClientRect().top >= 64")
    assert page.locator(".button-primary").first.evaluate(
        "node => node.getBoundingClientRect().width >= 48 && node.getBoundingClientRect().height >= 48"
    )


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 375, "height": 812}, device_scale_factor=1)
    errors = []
    bridge_calls = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.expose_function("recordBridgeCall", lambda value: bridge_calls.append(value))
    page.add_init_script(
        """
        window.xhs = { miniTool: {
          writeTempFile: async ({data}) => { await window.recordBridgeCall('temp:' + data.slice(0, 22)); return {filePath: 'local://poster.png'}; },
          saveImageToPhotosAlbum: async ({filePath}) => { await window.recordBridgeCall('save:' + filePath); return {success: true}; },
          postNote: async ({title}) => { await window.recordBridgeCall('post:' + title); return {success: true}; }
        }};
        """
    )
    page.goto(base_url, wait_until="networkidle")

    assert page.title() == "黑话段位局｜互联网黑话通关测评"
    assert page.get_by_text("最高段位，是敢把话说明白").is_visible()
    assert page.locator(".rank-teaser").count() >= 3
    assert_mobile_layout(page)

    page.get_by_role("button", name="开始段位扫描").click()
    answered = 0
    seen_phases = set()
    while page.locator("#quiz-screen").is_visible() and answered < 16:
        seen_phases.add(page.locator("#question-phase").inner_text())
        options = page.locator(".option-button")
        assert options.count() == 4
        options.nth(answered % 4).click()
        assert page.locator("#next-button").is_enabled()
        page.locator("#next-button").click()
        answered += 1
        page.wait_for_timeout(80)

    page.locator("#report-screen").wait_for(state="visible")
    assert 13 <= answered <= 15
    assert any("基础" in phase for phase in seen_phases)
    assert any("专项" in phase for phase in seen_phases)
    assert any("综合" in phase for phase in seen_phases)
    assert page.locator("#result-rank-name").inner_text()
    assert 0 <= int(page.locator("#result-overall").inner_text()) <= 100
    assert page.locator("#radar-canvas").evaluate("node => node.width > 0 && node.height > 0")
    assert page.locator(".badge-chip").count() == 2
    assert page.locator(".report-section").count() >= 5
    assert page.evaluate("JSON.parse(localStorage.getItem('jargon-arena-history-v2')).length === 1")
    page.screenshot(path=str(artifact_dir / "report.png"), full_page=True)

    page.get_by_role("button", name="生成高清通行证").click()
    page.locator("#share-modal").wait_for(state="visible")
    assert page.locator("#poster-preview").get_attribute("src").startswith("data:image/png")
    assert page.locator("#poster-canvas").evaluate("node => node.width === 1080 && node.height === 1440")
    page.get_by_role("button", name="保存到相册").click()
    page.wait_for_timeout(60)
    page.get_by_role("button", name="发小红书笔记").click()
    page.wait_for_timeout(60)
    assert any(call.startswith("save:") for call in bridge_calls)
    assert any(call.startswith("post:") for call in bridge_calls)
    page.get_by_role("button", name="关闭分享预览").click()

    page.get_by_role("button", name="段位图鉴").click()
    assert page.locator(".rank-dossier").count() == 8
    page.get_by_role("button", name="黑话词典").click()
    assert page.locator(".glossary-item").count() >= 30
    page.locator("#glossary-search").fill("抓手")
    assert page.locator(".glossary-item").count() == 1
    page.get_by_role("button", name="测评记录").click()
    assert page.locator(".history-item").count() == 1

    page.get_by_role("button", name="返回首页").click()
    page.get_by_role("button", name="开始段位扫描").click()
    second_answered = 0
    while page.locator("#quiz-screen").is_visible() and second_answered < 16:
        page.locator(".option-button").nth((second_answered + 2) % 4).click()
        page.locator("#next-button").click()
        second_answered += 1
        page.wait_for_timeout(40)
    page.locator("#report-screen").wait_for(state="visible")
    assert page.locator("#comparison-section").is_visible()
    assert page.locator(".comparison-item").count() == 5
    assert page.evaluate("JSON.parse(localStorage.getItem('jargon-arena-history-v2')).length === 2")

    for width, height in [(320, 568), (430, 932)]:
        page.set_viewport_size({"width": width, "height": height})
        page.reload(wait_until="networkidle")
        assert page.locator("#home-screen").is_visible()
        assert_mobile_layout(page)

    assert not errors, errors
    browser.close()

print(f"UI smoke test passed. Artifacts: {artifact_dir}")
