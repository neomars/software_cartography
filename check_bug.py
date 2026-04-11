import asyncio
from playwright.async_api import async_playwright
import os

async def check_admin_softwares_bug():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            await page.goto("http://localhost:3000/admin/softwares")
            await page.wait_for_selector("h2")

            # Click somewhere that is NOT the import button
            # Let's say the title
            await page.click("h2")

            # Check if a file chooser was triggered
            # In playwright we can wait for a file chooser
            # But here we want to see if it happens unexpectedly.

            # Another way: check if the label for the file input covers the whole page.
            # Let's check the bounding box of the label.
            label = page.locator("label:has-text('Importer CSV')")
            box = await label.bounding_box()
            print(f"Import Label Bounding Box: {box}")

            viewport = page.viewport_size
            print(f"Viewport size: {viewport}")

            if box and viewport:
                if box['width'] >= viewport['width'] * 0.8 and box['height'] >= viewport['height'] * 0.8:
                    print("BUG DETECTED: Label seems to cover a large portion of the screen")
                else:
                    print("Label size seems normal")

            await page.screenshot(path="client/media/check_bug_admin_softwares.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(check_admin_softwares_bug())
