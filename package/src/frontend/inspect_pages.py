"""Inspect all pages of the BLA app - capture screenshots and console errors"""
from playwright.sync_api import sync_playwright
import json

PAGES = [
    ("login", "http://localhost:5173/login"),
    ("dashboard", "http://localhost:5173/"),
    ("projects_new", "http://localhost:5173/projects/new"),
    ("reviews", "http://localhost:5173/reviews"),
    ("artifacts", "http://localhost:5173/artifacts"),
    ("plugins", "http://localhost:5173/plugins"),
    ("settings", "http://localhost:5173/settings"),
    ("agent_config", "http://localhost:5173/settings/agent-config"),
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})

    # Collect console errors per page
    for name, url in PAGES:
        page = context.new_page()
        errors = []
        page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type in ("error", "warning") else None)
        page.on("pageerror", lambda exc: errors.append(f"[PAGEERROR] {exc}"))

        try:
            page.goto(url, wait_until="domcontentloaded", timeout=10000)
            page.wait_for_load_state("networkidle", timeout=8000)
        except Exception as e:
            errors.append(f"[NAV_ERROR] {e}")

        page.wait_for_timeout(1500)
        page.screenshot(path=f"c:/Users/32277/Desktop/IPDagents/frontend/inspect_{name}.png", full_page=True)
        title = page.title()
        body_text = page.locator("body").inner_text()[:300] if page.locator("body").count() else "(empty body)"
        print(f"\n=== {name} ({url}) ===")
        print(f"Title: {title}")
        print(f"Body preview: {body_text[:200]}")
        if errors:
            print(f"Console issues ({len(errors)}):")
            for e in errors[:15]:
                print(f"  - {e}")
        else:
            print("Console: clean")
        page.close()

    browser.close()
print("\nDone. Screenshots saved.")
