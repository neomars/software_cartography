import time
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.goto("http://localhost:3000")
    time.sleep(2)

    print("Clicking on Logiciels...")
    # Find the link that contains "Logiciels"
    page.click("nav a:has-text('Logiciels')")
    time.sleep(2)

    print(f"Current URL: {page.url}")

    # Check for file chooser on click anywhere
    chooser_opened = False
    def on_file_chooser(chooser):
        nonlocal chooser_opened
        chooser_opened = True
        print("File chooser OPENED!")

    page.on("filechooser", on_file_chooser)

    # Test multiple points
    points = [(640, 360), (100, 100), (900, 100), (500, 800)]
    for x, y in points:
        print(f"Clicking at ({x}, {y})...")
        page.mouse.click(x, y)
        time.sleep(0.5)
        if chooser_opened:
            print(f"BUG REPRODUCED at ({x}, {y})!")
            break

    if not chooser_opened:
        print("Bug not reproduced.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
