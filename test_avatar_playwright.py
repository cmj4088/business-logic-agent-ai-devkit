"""测试头像更换流程"""
import sys
import os
import base64

# 创建一个 200x200 的红色 JPEG 测试图片
def create_test_image():
    """创建一个小的测试图片并返回 base64 编码"""
    # 使用 PIL 创建图片
    try:
        from PIL import Image
        img = Image.new('RGB', (200, 200), color=(255, 0, 0))
        img.save('test_avatar.jpg', 'JPEG')
        print("[Test] Created test image: test_avatar.jpg")
        return os.path.abspath('test_avatar.jpg')
    except ImportError:
        # 如果没有 PIL，创建一个最小的 JPEG
        # 1x1 红色像素的最小 JPEG
        import struct
        # 最小 JPEG header + 1x1 红色像素
        jpeg_data = bytes([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
            0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
            0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
            0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
            0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
            0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
            0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
            0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
            0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
            0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
            0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
            0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
            0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
            0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
            0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
            0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
            0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
            0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
            0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
            0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
            0x00, 0x00, 0x3F, 0x00, 0x7B, 0x40, 0x1B, 0xFF, 0xD9
        ])
        with open('test_avatar.jpg', 'wb') as f:
            f.write(jpeg_data)
        print("[Test] Created minimal test image: test_avatar.jpg")
        return os.path.abspath('test_avatar.jpg')


def main():
    from playwright.sync_api import sync_playwright

    test_image_path = create_test_image()
    print(f"[Test] Test image path: {test_image_path}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # 非 headless 以便观察
        context = browser.new_context()
        page = context.new_page()

        # 捕获控制台日志
        page.on("console", lambda msg: print(f"[Browser Console] {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"[Browser Error] {err}"))

        # 1. 访问登录页
        print("\n[Test] Step 1: Navigate to login page")
        page.goto('http://localhost:5173/login')
        page.wait_for_load_state('networkidle')
        page.screenshot(path='test_step1_login.png')
        print("[Test] Screenshot: test_step1_login.png")

        # 2. 登录
        print("\n[Test] Step 2: Login as admin@ipd.com")
        email_input = page.locator('input[type="email"], input[placeholder*="邮箱"], input[id*="email"]').first
        email_input.fill('admin@ipd.com')
        password_input = page.locator('input[type="password"]').first
        password_input.fill('Admin123456!')
        login_button = page.locator('button:has-text("登录"), button[type="submit"]').first
        login_button.click()
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
        page.screenshot(path='test_step2_dashboard.png')
        print("[Test] Screenshot: test_step2_dashboard.png")

        # 3. 打开用户设置弹窗（点击导航栏的用户名）
        print("\n[Test] Step 3: Open user settings")
        # 尝试多种方式打开用户设置
        # 方式1: 点击导航栏的用户名
        user_button = page.locator('text=admin').first
        if user_button.is_visible():
            user_button.click()
            page.wait_for_timeout(1000)
            print("[Test] Clicked 'admin' text")
        else:
            # 方式2: 点击头像
            avatar = page.locator('.ant-avatar, img[class*="rounded-full"]').first
            if avatar.is_visible():
                avatar.click()
                page.wait_for_timeout(1000)
                print("[Test] Clicked avatar")
        page.screenshot(path='test_step3_settings.png')
        print("[Test] Screenshot: test_step3_settings.png")

        # 4. 点击头像区域
        print("\n[Test] Step 4: Click avatar to upload")
        # 查找 "点击头像更换图片" 文本附近的可点击区域
        avatar_area = page.locator('div:has-text("点击头像更换图片")').first
        if avatar_area.is_visible():
            # 点击头像区域（向上一点的位置）
            box = avatar_area.bounding_box()
            if box:
                page.mouse.click(box['x'] + box['width'] / 2, box['y'] - 50)
                page.wait_for_timeout(1000)
                print("[Test] Clicked avatar area")
        page.screenshot(path='test_step4_file_dialog.png')
        print("[Test] Screenshot: test_step4_file_dialog.png")

        # 5. 上传文件
        print("\n[Test] Step 5: Upload test image")
        # 查找 file input 并设置文件
        file_input = page.locator('input[type="file"]').first
        if file_input.count() > 0:
            file_input.set_input_files(test_image_path)
            page.wait_for_timeout(2000)
            print("[Test] File uploaded")
        else:
            print("[Test] No file input found!")

        page.screenshot(path='test_step5_crop.png')
        print("[Test] Screenshot: test_step5_crop.png")

        # 6. 确认裁切
        print("\n[Test] Step 6: Confirm crop")
        confirm_button = page.locator('button:has-text("确认裁切")').first
        if confirm_button.is_visible():
            confirm_button.click()
            page.wait_for_timeout(1000)
            print("[Test] Clicked confirm crop")
        else:
            print("[Test] No confirm crop button found!")

        page.screenshot(path='test_step6_after_crop.png')
        print("[Test] Screenshot: test_step6_after_crop.png")

        # 7. 保存资料
        print("\n[Test] Step 7: Save profile")
        save_button = page.locator('button:has-text("保存")').first
        if save_button.is_visible():
            save_button.click()
            page.wait_for_timeout(2000)
            print("[Test] Clicked save")
        else:
            print("[Test] No save button found!")

        page.screenshot(path='test_step7_after_save.png')
        print("[Test] Screenshot: test_step7_after_save.png")

        # 8. 检查最终状态
        print("\n[Test] Step 8: Verify avatar updated")
        # 重新获取用户信息
        page.screenshot(path='test_step8_final.png')
        print("[Test] Screenshot: test_step8_final.png")

        browser.close()
        print("\n[Test] Done!")

if __name__ == '__main__':
    main()
