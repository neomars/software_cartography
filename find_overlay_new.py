from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000/admin/softwares")
    page.wait_for_timeout(2000)

    # Check what's at 500, 500
    el = page.evaluate("""() => {
        const el = document.elementFromPoint(500, 500);
        return {
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            outerHTML: el.outerHTML.substring(0, 200),
            parents: (() => {
                let p = el;
                let path = [];
                while(p) {
                    path.push(p.tagName + (p.id ? '#' + p.id : ''));
                    p = p.parentElement;
                }
                return path.join(' > ');
            })()
        };
    }""")
    print(f"Element at 500, 500: {el}")

    # Check for all labels
    labels = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('label')).map(l => ({
            text: l.innerText,
            for: l.htmlFor,
            rect: l.getBoundingClientRect()
        }));
    }""")
    print(f"Labels: {labels}")

    # Check for all inputs type file
    files = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('input[type="file"]')).map(i => ({
            id: i.id,
            rect: i.getBoundingClientRect(),
            className: i.className
        }));
    }""")
    print(f"File inputs: {files}")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
