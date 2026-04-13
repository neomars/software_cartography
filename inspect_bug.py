import asyncio
from playwright.async_api import async_playwright

async def inspect_page():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        try:
            await page.goto("http://localhost:3000/admin/softwares")
            await page.wait_for_timeout(3000)

            # Find what element is at various points
            points = [(10, 10), (640, 360), (1000, 100)]
            for x, y in points:
                el_info = await page.evaluate("""(p) => {
                    const el = document.elementFromPoint(p.x, p.y);
                    if (!el) return "NONE";
                    return {
                        tagName: el.tagName,
                        id: el.id,
                        className: el.className,
                        outerHTML: el.outerHTML.substring(0, 100)
                    };
                }""", {'x': x, 'y': y})
                print(f"At ({x}, {y}): {el_info}")

            # Look for any file inputs that are NOT hidden
            inputs = await page.evaluate("""() => {
                return Array.from(document.querySelectorAll('input[type="file"]')).map(i => ({
                    id: i.id,
                    className: i.className,
                    isVisible: i.offsetWidth > 0 && i.offsetHeight > 0,
                    rect: i.getBoundingClientRect()
                }));
            }""")
            print(f"File inputs: {inputs}")

            # Look for labels
            labels = await page.evaluate("""() => {
                return Array.from(document.querySelectorAll('label')).map(l => ({
                    text: l.innerText,
                    rect: l.getBoundingClientRect()
                }));
            }""")
            print(f"Labels: {labels}")

            await page.screenshot(path="debug_screenshot.png")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(inspect_page())
