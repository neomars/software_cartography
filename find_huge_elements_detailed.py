from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000/admin/softwares")
    page.wait_for_timeout(3000)

    huge = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('*')).map(el => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            if (rect.width > 500 && rect.height > 500) {
                return {
                    tagName: el.tagName,
                    className: el.className,
                    id: el.id,
                    rect: { width: rect.width, height: rect.height },
                    position: style.position,
                    zIndex: style.zIndex,
                    opacity: style.opacity,
                    display: style.display
                };
            }
            return null;
        }).filter(x => x !== null);
    }""")
    print(huge)
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
