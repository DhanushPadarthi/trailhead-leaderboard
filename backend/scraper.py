from playwright.async_api import async_playwright
import asyncio

class TrailheadScraper:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.context = None

    async def start(self):
        """Initializes the browser instance with stealth features."""
        if not self.browser:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                # Don't use channel="chrome" - use downloaded Chromium for Render compatibility
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-infobars",
                    "--window-size=1920,1080",
                    "--disable-web-security",
                    "--disable-features=IsolateOrigins,site-per-process",
                    "--disable-background-timer-throttling",
                    "--disable-backgrounding-occluded-windows",
                    "--disable-renderer-backgrounding"
                ]
            )
            self.context = await self.browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                viewport={"width": 1920, "height": 1080},
                locale="en-US",
                timezone_id="America/New_York",
                permissions=["geolocation"],
                geolocation={"latitude": 40.7128, "longitude": -74.0060},
                extra_http_headers={
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Connection": "keep-alive",
                    "Upgrade-Insecure-Requests": "1"
                }
            )
            
            # Add script to hide automation
            await self.context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5]
                });
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en']
                });
                window.chrome = {
                    runtime: {}
                };
            """)
            
            print("Browser started with stealth mode.")

    async def stop(self):
        """Closes the browser instance."""
        if self.browser:
            await self.browser.close()
            self.browser = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None
        print("Browser stopped.")

    async def scrape_profile(self, url: str):
        """
        Scrapes a single Trailhead profile using the persistent browser.
        Optimized for speed and accuracy.
        """
        if not url:
            return {"points": 0, "badges": 0, "error": "No URL provided"}
            
        if not self.browser:
            await self.start()


        page = await self.context.new_page()
        try:
            # Add random delay before navigation (0.5-2 seconds)
            await asyncio.sleep(__import__('random').uniform(0.5, 2))
            
            # Navigate with optimized timeout
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)

            # Quick check for access denied
            title = await page.title()
            if "Access Denied" in title:
                return {"points": 0, "badges": 0, "error": "Access Denied (Bot Detected)"}

            # Wait for main content with random delay
            try:
                await page.wait_for_selector("lwc-tbui-tally", timeout=20000)
            except:
                return {"points": 0, "badges": 0, "error": "Profile content not found"}

            # Random human-like wait (1-2 seconds)
            await asyncio.sleep(__import__('random').uniform(1, 2))

            # Extract tally values (points, badges)
            tallies = page.locator("lwc-tbui-tally")
            count = await tallies.count()

            values = []
            for i in range(count):
                tally = tallies.nth(i)
                counts = await tally.evaluate(
                    """el => {
                        if (!el.shadowRoot) return [];
                        return Array.from(
                            el.shadowRoot.querySelectorAll('span.tally__count')
                        ).map(s => s.innerText.trim());
                    }"""
                )
                values.extend(counts)

            nums = [int(v.replace(",", "")) for v in values if v.replace(",", "").isdigit()]
            sorted_nums = sorted(set(nums), reverse=True)

            points = sorted_nums[0] if len(sorted_nums) >= 1 else 0
            badges = sorted_nums[1] if len(sorted_nums) >= 2 else 0

            # Extract certifications
            certifications = []
            try:
                cert_links = page.locator("div.content-body div.title a")
                cert_count = await cert_links.count()
                
                if cert_count > 0:
                    cert_texts = await cert_links.all_inner_texts()
                    certifications = [t.strip() for t in cert_texts if t.strip()]
            except Exception as e:
                print(f"Cert scraping error: {e}")
                
            # Extract Agentblazer statuses
            agentblazer_status = []
            try:
                ab_components = page.locator("lwc-tbme-agentblazer-level")
                ab_count = await ab_components.count()
                
                found_texts = []
                for i in range(ab_count):
                    comp = ab_components.nth(i)
                    text = await comp.evaluate("""el => {
                        if (!el.shadowRoot) return '';
                        const footer = el.shadowRoot.querySelector('.level-status-footer');
                        return footer ? footer.innerText : '';
                    }""")
                    if text:
                        found_texts.append(text)
                
                possible_statuses = ['Champion 2026', 'Innovator 2026', 'Legend 2026']
                agentblazer_status = [s for s in possible_statuses if any(s in t for t in found_texts)]
            except Exception as e:
                print(f"Agentblazer scraping error: {e}")

            print(f"✓ Scraped {url}: {points} pts, {badges} badges, {len(certifications)} certs, {len(agentblazer_status)} AB statuses")

            return {
                "points": points,
                "badges": badges,
                "certifications": certifications,
                "agentblazer_status": agentblazer_status
            }

        except asyncio.TimeoutError:
            print(f"✗ Timeout scraping {url}")
            return {"points": 0, "badges": 0, "error": "Timeout"}
        except Exception as e:
            print(f"✗ Error scraping {url}: {e}")
            return {"points": 0, "badges": 0, "error": str(e)}
        finally:
            await page.close()

# Global instance
scraper = TrailheadScraper()

# Keeping a sync wrapper for backward compatibility if needed, 
# but mostly we should use the async scraper directly.
def scrape_trailhead_profile(url: str):
    """
    Synchronous wrapper for backward compatibility (only if absolutely needed).
    Better to use await scraper.scrape_profile(url) in async contexts.
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(scraper.scrape_profile(url))
    return result

if __name__ == "__main__":
    async def main():
        await scraper.start()
        test_url = "https://www.salesforce.com/trailblazer/t7myk9tnc2xdddsb53"
        print(await scraper.scrape_profile(test_url))
        await scraper.stop()
    
    asyncio.run(main())
