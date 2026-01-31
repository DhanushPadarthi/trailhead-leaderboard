from playwright.async_api import async_playwright
import asyncio

class TrailheadScraper:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.context = None

    async def start(self):
        """Initializes the browser instance."""
        if not self.browser:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                    "--no-sandbox",
                    "--disable-setuid-sandbox"
                ]
            )
            self.context = await self.browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
            )
            print("Browser started.")

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
        Original working version - uses reliable selectors with proper error handling.
        """
        if not url:
            return {"points": 0, "badges": 0, "error": "No URL provided"}
            
        if not self.browser:
            await self.start()

        page = await self.context.new_page()
        try:
            # Navigate to the profile with longer timeout
            await page.goto(url, wait_until="domcontentloaded", timeout=60000)
            
            # Wait for content and check for access denied
            try:
                await page.wait_for_selector("lwc-tbui-tally", timeout=30000)
            except:
                print("Tally not found immediately, checking title...")
                title = await page.title()
                if "Access Denied" in title:
                    print("Access Denied detected.")
                    return {"points": 0, "badges": 0, "error": "Access Denied (Bot Detected)"}
                return {"points": 0, "badges": 0, "error": "Profile content not found"}

            # Wait for page to stabilize
            await asyncio.sleep(2)

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
