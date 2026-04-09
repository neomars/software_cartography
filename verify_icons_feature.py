import asyncio
from playwright.async_api import async_playwright
import os

async def verify_icons():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            # Navigate to Admin Softwares
            await page.goto("http://localhost:3000/admin/softwares")
            await page.wait_for_selector("h2")

            # Click Add button to open modal
            await page.click("button:has-text('Ajouter')")
            await page.wait_for_selector("h3:has-text('Ajouter')")

            # Check if IconPicker is present (it has text 'Choisir un icône')
            icon_picker = page.locator("text=Choisir un icône")
            await icon_picker.wait_for(state="visible")
            print("Icon Picker found in Software modal")

            # Click it to open library
            await icon_picker.click()
            await page.wait_for_selector("text=Librairie d'icônes")
            print("Icon Library opened")

            # Search for an icon
            await page.fill("input[placeholder='Rechercher...']", "Activity")
            await page.wait_for_timeout(500) # Wait for filter

            # Take screenshot of the modal with icon library
            await page.screenshot(path="client/media/verify_icon_picker_modal.png")
            print("Screenshot saved: client/media/verify_icon_picker_modal.png")

            # Close modal
            await page.click("button:has(svg.lucide-x)")

            # Navigate to Admin Services
            await page.goto("http://localhost:3000/admin/services")
            await page.wait_for_selector("h2")

            # Click Add button
            await page.click("button:has-text('Créer')")
            await page.wait_for_selector("h3:has-text('Services')")

            # Check IconPicker
            icon_picker_service = page.locator("text=Choisir un icône")
            await icon_picker_service.wait_for(state="visible")
            print("Icon Picker found in Service modal")

            await page.screenshot(path="client/media/verify_icon_picker_service.png")

        except Exception as e:
            print(f"Error during verification: {e}")
            await page.screenshot(path="client/media/verify_icons_error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_icons())
