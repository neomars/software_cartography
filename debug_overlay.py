import asyncio
from playwright.async_api import async_playwright

async def debug_overlay():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        try:
            await page.goto("http://localhost:3000/admin/softwares")
            await page.wait_for_selector("h2")

            # Find all labels and their sizes
            labels = await page.locator("label").all()
            print(f"Found {len(labels)} labels")
            for i, label in enumerate(labels):
                box = await label.bounding_box()
                text = await label.inner_text()
                print(f"Label {i} ('{text.strip()[:20]}...'): {box}")

            # Find all inputs and their sizes
            inputs = await page.locator("input[type='file']").all()
            print(f"Found {len(inputs)} file inputs")
            for i, inp in enumerate(inputs):
                box = await inp.bounding_box()
                print(f"Input {i}: {box}")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_overlay())
