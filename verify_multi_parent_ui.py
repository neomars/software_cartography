import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Admin Softwares - Search for Multi-Parent Test
        print("Capturing Multi-Parent Software in Admin...")
        await page.goto("http://localhost:3000/admin/softwares", wait_until="networkidle")
        await page.wait_for_selector("table", timeout=10000)
        # Type in search if there is one.
        # Checking for search input:
        search_input = await page.query_selector("input[placeholder*='Rechercher']")
        if search_input:
            await search_input.type("SW Multi-Parent Test")
            await asyncio.sleep(1)
        else:
            # Try scrolling to the bottom if no search
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1)

        await page.screenshot(path="admin_softwares_multiparent.png")

        # Admin Services - Search for Multi-Parent Test
        print("Capturing Multi-Parent Service in Admin...")
        await page.goto("http://localhost:3000/admin/services", wait_until="networkidle")
        await page.wait_for_selector(".grid", timeout=10000)

        # Same for services
        search_input = await page.query_selector("input[placeholder*='Rechercher']")
        if search_input:
            await search_input.type("Service Multi-Parent Test")
            await asyncio.sleep(1)
        else:
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1)

        await page.screenshot(path="admin_services_multiparent.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
