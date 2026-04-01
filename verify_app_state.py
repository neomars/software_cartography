import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # 3D Visualization
        print("Capturing 3D Visualization...")
        await page.goto("http://localhost:3000/", wait_until="networkidle")
        await asyncio.sleep(10)
        await page.screenshot(path="viz_3d_final.png")

        # 2D Visualization
        print("Capturing 2D Visualization...")
        await page.goto("http://localhost:3000/2d", wait_until="networkidle")
        await asyncio.sleep(5)
        await page.screenshot(path="viz_2d_final.png")

        # Admin Softwares
        print("Capturing Admin Softwares...")
        await page.goto("http://localhost:3000/admin/softwares", wait_until="networkidle")
        await page.wait_for_selector("table", timeout=10000)
        await page.screenshot(path="admin_softwares_final.png")

        # Admin Services
        print("Capturing Admin Services...")
        await page.goto("http://localhost:3000/admin/services", wait_until="networkidle")
        await page.wait_for_selector(".grid", timeout=10000)
        await page.screenshot(path="admin_services_final.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
