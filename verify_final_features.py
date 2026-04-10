import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # 1. Verify Admin Services Tree View
        print("Checking Admin Services Tree View...")
        await page.goto("http://localhost:3000/admin/services", wait_until="networkidle")
        tree_button = page.get_by_role("button", name="Arborescence")
        await tree_button.click(force=True)
        await asyncio.sleep(3) # Wait for layout to stabilize
        await page.screenshot(path="verify_admin_services_tree_v2.png")

        # 2. Verify Admin Softwares View Switcher
        print("Checking Admin Softwares Tree View...")
        await page.goto("http://localhost:3000/admin/softwares", wait_until="networkidle")
        tree_button_soft = page.get_by_role("button", name="Arborescence")
        await tree_button_soft.click(force=True)
        await asyncio.sleep(3)
        await page.screenshot(path="verify_admin_softwares_tree_v2.png")

        # 3. Verify Simulation CSV Button in 2D
        print("Checking Simulation CSV Button in 2D...")
        await page.goto("http://localhost:3000/2d", wait_until="networkidle")
        # Click "Simuler Panne" button
        sim_button = page.get_by_role("button", name="Simuler Panne")
        await sim_button.click(force=True)
        await asyncio.sleep(1)
        # Now click a node to actually trigger the simulation state where CSV might be more relevant
        # or just check if it appeared. According to code, it appears as soon as simulation mode is ON.
        await page.screenshot(path="verify_sim_2d_active.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
