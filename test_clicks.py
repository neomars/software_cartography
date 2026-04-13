from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000/admin/softwares")
    page.wait_for_timeout(2000)

    # Try to click on various coordinates and see what happens
    points = [
        (10, 10), (100, 100), (500, 500), (800, 800), (10, 1000), (100, 1000)
    ]

    for x, y in points:
        el = page.evaluate(f"() => document.elementFromPoint({x}, {y})?.outerHTML.substring(0, 100)")
        print(f"At ({x}, {y}): {el}")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
