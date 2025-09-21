import re
from playwright.sync_api import Page, expect

def verify_professors_page(page: Page):
    """
    This script verifies that the new 'Profesores' page is correctly
    integrated and displays the expected content.
    """
    # 1. Arrange: Go to the application's home page.
    page.goto("http://localhost:5173/")

    # 2. Act: Find the "Profesores" link in the navigation and click it.
    professors_link = page.get_by_role("link", name="Profesores")
    professors_link.click()

    # 3. Assert: Confirm the new page has loaded by checking for the title.
    heading = page.get_by_role("heading", name=re.compile("aprender o perfeccionarte en p.del"))
    expect(heading).to_be_visible(timeout=10000)

    # Also assert that at least one professor card is rendered.
    expect(page.get_by_text("Juan Carlos \"El Profe\" Pérez")).to_be_visible()

    # 4. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="frontend/jules-scratch/professors-page.png")

# Boilerplate to run the verification
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    verify_professors_page(page)
    browser.close()
    print("Verification script finished and screenshot taken.")
