import asyncio
from playwright.async_api import async_playwright

async def debug_center_element():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        try:
            await page.goto("http://localhost:3000/admin/softwares")
            await page.wait_for_selector("h2")

            # Find element at center
            element = await page.evaluate("""() => {
                const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
                function getPath(curr) {
                    if (!curr) return "";
                    return getPath(curr.parentElement) + " > " + curr.tagName + (curr.className ? "." + curr.className.split(" ").join(".") : "");
                }
                return {
                    tagName: el.tagName,
                    className: el.className,
                    type: el.type,
                    id: el.id,
                    path: getPath(el)
                };
            }""")
            print(f"Element at center: {element}")

            # Check for any label that might be covering it
            labels = await page.locator("label").all()
            for i, label in enumerate(labels):
                box = await label.bounding_box()
                if box:
                    print(f"Label {i} box: {box}")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_center_element())
