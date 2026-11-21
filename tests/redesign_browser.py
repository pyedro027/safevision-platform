"""Capture the local redesign against an already running static build."""
import argparse
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("origin")
parser.add_argument("evidence", type=Path)
parser.add_argument("--chrome", required=True)
args = parser.parse_args()
args.evidence.mkdir(exist_ok=True, parents=True)
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=args.chrome)
    page = browser.new_page()
    for width in (375, 430, 768, 1024, 1440, 1920):
        page.set_viewport_size({"width": width, "height": 900})
        for route in ("inicio", "projetos", "studio", "aurea", "conta", "configuracoes"):
            page.goto(args.origin + "/#" + route)
            expect(page.locator('nav [aria-current="page"]')).to_have_attribute("href", "#" + route)
            expect(page.locator("h1")).to_be_visible()
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (width, route)
            if width == 1440 or (width == 375 and route == "inicio"):
                page.screenshot(path=args.evidence / f"{route}-{width}.png", full_page=True)
        if width < 811:
            menu = page.get_by_role("button", name="Menu", exact=True)
            menu.focus()
            page.keyboard.press("Enter")
            expect(menu).to_have_attribute("aria-expanded", "true")
            page.keyboard.press("Escape")
            expect(menu).to_be_focused()
            expect(menu).to_have_attribute("aria-expanded", "false")
            menu.click()
            page.get_by_role("link", name="Visão geral", exact=True).click()
            expect(menu).to_have_attribute("aria-expanded", "false")
    browser.close()
print("6 routes x 6 widths passed; mobile keyboard and focus passed.")
