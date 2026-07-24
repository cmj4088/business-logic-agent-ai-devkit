# -*- coding: utf-8 -*-
"""Test avatar upload flow"""
from playwright.sync_api import sync_playwright
import os
import base64

RED_PIXEL_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
)
TEST_IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_avatar.png")
with open(TEST_IMG, "wb") as f:
    f.write(RED_PIXEL_PNG)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on("console", lambda msg: print("[CONSOLE %s] %s" % (msg.type, msg.text)))
    page.on("pageerror", lambda err: print("[PAGE ERROR] %s" % err))

    print("=== 1. Navigate to login ===")
    page.goto("http://localhost:5173/login")
    page.wait_for_load_state("networkidle")

    print("=== 2. Login ===")
    page.locator("input[type=email]").first.fill("demo@bla.com")
    page.locator("input[type=password]").first.fill("demo123456")
    page.locator("button[type=submit]").first.click()
    page.wait_for_timeout(2000)
    page.wait_for_load_state("networkidle")
    print("URL: %s" % page.url)

    print("=== 3. Open user profile modal ===")
    # Click on user display name in nav
    page.locator("button").filter(has_text="Demo").first.click()
    page.wait_for_timeout(1000)

    print("=== 4. Find file input ===")
    file_input = page.locator("input[type=file]")
    print("file input count: %d" % file_input.count())

    if file_input.count() == 0:
        print("ERROR: No file input found!")
    else:
        print("=== 5. Upload image ===")
        file_input.set_input_files(TEST_IMG)
        page.wait_for_timeout(2000)

        print("=== 6. Check crop modal ===")
        crop_confirm = page.locator("button").filter(has_text="confirm")
        crop_confirm_cn = page.locator("text=crop")
        crop_title = page.locator("h3")
        print("h3 count: %d" % crop_title.count())
        if crop_title.count() > 0:
            print("h3 text: %s" % crop_title.all_text_contents())

        # Check for crop dialog by looking for z-index 60
        crop_dialog = page.locator("[class*='z-[60]']")
        print("z-60 dialog count: %d" % crop_dialog.count())

        # Take screenshot
        page.screenshot(path=os.path.join(os.path.dirname(os.path.abspath(__file__)), "shot_after_upload.png"))

        # Check all buttons
        buttons = page.locator("button")
        print("all buttons: %s" % buttons.all_text_contents())

    print("=== Done ===")
    browser.close()
