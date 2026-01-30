from scraper import scrape_trailhead_profile

url = "https://www.salesforce.com/trailblazer/t7myk9tnc2xdddsb53"
print(f"Testing scrape for: {url}")
result = scrape_trailhead_profile(url)
print(f"Result: {result}")
