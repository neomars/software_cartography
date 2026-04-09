from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000/admin/softwares")
    page.wait_for_timeout(3000)

    # Check what happens when we click
    page.on("filechooser", lambda file_chooser: print(f"File chooser opened!"))

    print("Clicking at (10, 10)...")
    page.mouse.click(10, 10)
    page.wait_for_timeout(500)

    print("Clicking at (500, 500)...")
    page.mouse.click(500, 500)
    page.wait_for_timeout(500)

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
