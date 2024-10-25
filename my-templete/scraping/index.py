from playwright.sync_api import sync_playwright
import json

def scrape_ielts_mock_test():
    data = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Set to True if you want to run in headless mode
        page = browser.new_page()
        page.goto("https://britishcouncil.gelielts.com/mock/listening")

        # Click on "Full Listening test"
        page.wait_for_selector('a:has-text("Full Listening test")')
        page.click('a:has-text("Full Listening test")')

        while True:
            # Wait for questions to load
            page.wait_for_selector('.question')  # Adjust the selector if needed

            # Extract data from the page
            questions = page.locator('.question').all_inner_texts()
            data.extend(questions)

            # Check if there's a "Next" button and click it
            next_button = page.locator('a:has-text("Next")')
            if next_button.count() > 0:
                next_button.click()
                page.wait_for_load_state('networkidle')
            else:
                break  # No more "Next" button, exit the loop

        # Save the data to a JSON file
        with open('ielts_mock_test_data.json', 'w') as f:
            json.dump(data, f, indent=2)
        
        browser.close()

if __name__ == "__main__":
    scrape_ielts_mock_test()
