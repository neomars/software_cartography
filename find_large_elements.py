from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000/admin/softwares")
    page.wait_for_timeout(3000)

    # List all elements with their dimensions and see if any cover more than 50% of the screen
    large_elements = page.evaluate("""() => {
        const results = [];
        const threshold = (window.innerWidth * window.innerHeight) * 0.5;
        const all = document.getElementsByTagName('*');
        for (let el of all) {
            const rect = el.getBoundingClientRect();
            const area = rect.width * rect.height;
            if (area > threshold) {
                results.push({
                    tagName: el.tagName,
                    id: el.id,
                    className: el.className,
                    width: rect.width,
                    height: rect.height,
                    area: area,
                    parents: (() => {
                        let p = el;
                        let path = [];
                        while(p) {
                            path.push(p.tagName + (p.id ? '#' + p.id : ''));
                            p = p.parentElement;
                        }
                        return path.join(' > ');
                    })()
                });
            }
        }
        return results;
    }""")

    for el in large_elements:
        print(f"Large element: {el['tagName']}#{el['id']} ({el['className']}) - {el['width']}x{el['height']} - Area: {el['area']}")
        print(f"  Path: {el['parents']}")

    # Specifically check for any label or input that is large
    problematic = page.evaluate("""() => {
        const results = [];
        const all = document.querySelectorAll('label, input');
        for (let el of all) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 100 || rect.height > 100) {
                results.push({
                    tagName: el.tagName,
                    id: el.id,
                    className: el.className,
                    width: rect.width,
                    height: rect.height
                });
            }
        }
        return results;
    }""")
    print(f"Problematic labels/inputs: {problematic}")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
