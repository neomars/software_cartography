import asyncio
from playwright.async_api import async_playwright

async def find_large_elements():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        try:
            await page.goto("http://localhost:3000/admin/softwares")
            await page.wait_for_timeout(3000)

            large_elements = await page.evaluate("""() => {
                const results = [];
                const all = document.querySelectorAll('*');
                for (const el of all) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > window.innerWidth * 0.5 && rect.height > window.innerHeight * 0.5) {
                        results.push({
                            tagName: el.tagName,
                            id: el.id,
                            className: el.className,
                            width: rect.width,
                            height: rect.height,
                            type: el.type,
                            outerHTML: el.outerHTML.substring(0, 200)
                        });
                    }
                }
                return results;
            }""")
            print("Large elements:")
            for el in large_elements:
                print(el)

            # Specifically check for any label that is large
            large_labels = await page.evaluate("""() => {
                const results = [];
                const labels = document.querySelectorAll('label');
                for (const l of labels) {
                    const rect = l.getBoundingClientRect();
                    if (rect.width > 100 || rect.height > 100) {
                        results.push({
                            text: l.innerText,
                            width: rect.width,
                            height: rect.height,
                            html: l.outerHTML.substring(0, 200)
                        });
                    }
                }
                return results;
            }""")
            print("\nLarge labels:")
            for l in large_labels:
                print(l)

        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(find_large_elements())
