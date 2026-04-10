from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000/admin/softwares")
    page.wait_for_timeout(3000)

    found_at = None

    def handle_file_chooser(file_chooser):
        nonlocal found_at
        print(f"File chooser opened!")
        # We can't easily get the mouse position here but we know which one we just clicked

    page.on("filechooser", handle_file_chooser)

    for x in range(50, 1000, 100):
        for y in range(50, 1000, 100):
            found_at = (x, y)
            # print(f"Checking ({x}, {y})")
            page.mouse.click(x, y)
            page.wait_for_timeout(200)

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
