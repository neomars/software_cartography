import asyncio
from playwright.async_api import async_playwright

async def find_overlay():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        try:
            await page.goto("http://localhost:3000/admin/softwares")
            await page.wait_for_timeout(2000)

            points = [(10, 10), (100, 100), (200, 10), (640, 360), (1200, 700)]
            for x, y in points:
                res = await page.evaluate("""(p) => {
                    const el = document.elementFromPoint(p.x, p.y);
                    if (!el) return "NONE";
                    return el.tagName + "." + el.className.split(' ').join('.');
                }""", {'x': x, 'y': y})
                print(f"Point ({x}, {y}) hit: {res}")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(find_overlay())
