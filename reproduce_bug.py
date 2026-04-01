import asyncio
from playwright.async_api import async_playwright
import os

async def reproduce_bug():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            await page.goto("http://localhost:3000/admin/softwares")
            await page.wait_for_selector("h2")

            # Helper to check if file chooser is triggered on click
            async def is_file_chooser_triggered(selector):
                try:
                    async with page.expect_file_chooser(timeout=2000) as fc_info:
                        await page.click(selector)
                    return True
                except:
                    return False

            # Check title
            if await is_file_chooser_triggered("h2"):
                print("BUG: Clicking H2 triggered file chooser")

            # Check a random table cell if any
            rows = await page.locator("tbody tr").count()
            if rows > 0:
                if await is_file_chooser_triggered("tbody tr:first-child td:nth-child(2)"):
                    print("BUG: Clicking table cell triggered file chooser")

            # Check sidebar link
            if await is_file_chooser_triggered("nav a:first-child"):
                print("BUG: Clicking sidebar link triggered file chooser")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(reproduce_bug())
