from playwright.sync_api import sync_playwright

url = "https://www.salesforce.com/trailblazer/t7myk9tnc2xdddsb53"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    try:
        print("Navigating...")
        page.goto(url, timeout=30000, wait_until="domcontentloaded")
        print("Page loaded. Waiting for network idle...")
        page.wait_for_load_state("networkidle", timeout=10000)
        
        print("Saving content...")
        with open("backend/page_dump.html", "w", encoding="utf-8") as f:
            f.write(page.content())
            
        print("Checking for tally...")
        if page.locator("lwc-tbui-tally").count() > 0:
            print("Tally found!")
        else:
            print("Tally NOT found.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()
