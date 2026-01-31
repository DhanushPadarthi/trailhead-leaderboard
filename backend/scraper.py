from playwright.async_api import async_playwright
import asyncio
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TrailheadScraper:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.context = None

    async def start(self):
        """Initializes the browser instance with optimized settings."""
        if not self.browser:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-gpu",
                    "--disable-extensions",
                    "--disable-infobars"
                ]
            )
            # Create a persistent context with blocked resources for speed
            self.context = await self.browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
                extra_http_headers={
                    "Accept-Language": "en-US,en;q=0.9",
                    "sec-ch-ua": '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"Windows"',
                    "Upgrade-Insecure-Requests": "1"
                }
            )
            
            # Block heavy resources - removed 'other' as it may block API calls
            await self.context.route("**/*", lambda route: route.abort() 
                if route.request.resource_type in ["image", "media", "font"] 
                else route.continue_())
                
            logger.info("Browser started with optimized settings.")

    async def stop(self):
        """Closes the browser instance."""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        self.browser = None
        logger.info("Browser stopped.")

    async def scrape_profile(self, url: str):
        """
        Scrapes a single Trailhead profile.
        """
        if not url:
            return {"points": 0, "badges": 0, "error": "No URL provided"}
            
        if not self.browser:
            await self.start()

        page = await self.context.new_page()

        try:
            # Navigation - wait for DOM then sleep for LWC hydration
            try:
                logger.info(f"Navigating to {url}")
                response = await page.goto(url, wait_until="domcontentloaded", timeout=60000)
                
                # Check for 404 or non-success status
                if response and response.status == 404:
                    return {"points": 0, "badges": 0, "error": "Profile Not Found (404)"}
                
                logger.info(f"Page loaded, waiting 5s for hydration: {url}")
                await page.wait_for_timeout(5000) # Give LWC time to render
                
                # Check for redirect to generic pages which implies the specific profile wasn't accessible
                current_url = page.url
                if current_url.endswith("/trailblazer/profile") or current_url.endswith("/trailblazer/me"):
                     logger.warning(f"Redirected to generic profile for {url}")
                     return {"points": 0, "badges": 0, "error": "Profile Private/Hidden"}
                
                # Check 404 text in body if status didn't catch it
                body_text = await page.content()
                if "We can't find that page" in body_text or "Page Not Found" in body_text:
                     return {"points": 0, "badges": 0, "error": "Profile Not Found"}
                
                if "This user has chosen to keep their profile private" in body_text:
                    return {"points": 0, "badges": 0, "error": "Profile Private"}

            except Exception as e:
                logger.warning(f"Navigation issue for {url}: {e}")
                return {"points": 0, "badges": 0, "error": "Navigation Failed (Invalid URL)"}

            # --- OPTIMIZED VALUE EXTRACTION ---
            # Use Playwright's native shadow-dom piercing
            final_points = 0
            final_badges = 0
            
            try:
                # Selector that specifically targets the count inside the tally component
                # Playwright pierces shadow roots automatically
                counts_locator = page.locator("lwc-tbui-tally .tally__count")
                
                # Poll for stability
                for i in range(6):
                    if await counts_locator.count() > 0:
                        texts = await counts_locator.all_inner_texts()
                        logger.info(f"Poll {i}: Found texts {texts}")
                        
                        nums = []
                        for t in texts:
                             clean = t.replace(',', '').replace('+', '').strip()
                             if clean.isdigit():
                                 nums.append(int(clean))
                        
                        nums.sort(reverse=True)
                        curr_points = nums[0] if len(nums) > 0 else 0
                        curr_badges = nums[1] if len(nums) > 1 else 0
                        
                        if curr_points > 0 and curr_points == final_points:
                            break
                            
                        final_points = curr_points
                        final_badges = curr_badges
                    else:
                        logger.info(f"Poll {i}: No tally counts found yet")
                    
                    await asyncio.sleep(0.5)
                    
            except Exception as e:
                logger.error(f"Extraction error: {e}")

            # --- CERTIFICATIONS ---
            certifications = []
            try:
                # Strategy 1: Standard Credential Links (Unified)
                # Matches both old /credentials/ and new /certificate/ (Trailhead Academy) links
                cert_links = page.locator('a[href*="/credentials/certification-detail"], a[href*="/certificate/"]')
                count = await cert_links.count()
                for i in range(count):
                    text = await cert_links.nth(i).inner_text()
                    if text:
                        certifications.append(text.strip())
                
                # Strategy 2: Content-Body Title (Specific structure provided)
                if not certifications:
                    title_links = page.locator('.content-body .title a')
                    count = await title_links.count()
                    for i in range(count):
                        text = await title_links.nth(i).inner_text()
                        if text and "Certified" in text:
                             certifications.append(text.strip())

                certifications = list(set(certifications))
                logger.info(f"Found certs: {certifications}")
            except Exception as e:
                logger.error(f"Cert extraction error: {e}")

            # --- AGENTBLAZER STATUS ---
            agentblazer_status = []
            possible_statuses = ['Champion 2026', 'Innovator 2026', 'Legend 2026']
            
            try:
                # Method 1: Check specific component text (pierces shadow dom)
                status_locator = page.locator('lwc-tbme-agentblazer-level')
                if await status_locator.count() > 0:
                    status_text = await status_locator.all_inner_texts()
                    status_text_joined = " ".join(status_text)
                    for s in possible_statuses:
                        if s in status_text_joined:
                            agentblazer_status.append(s)
                
                # Method 2: Fallback to checking visibility of strict text locators
                if not agentblazer_status:
                    for s in possible_statuses:
                        # Scan page for this exact text
                        if await page.get_by_text(s).count() > 0:
                            agentblazer_status.append(s)

                logger.info(f"Found statuses: {agentblazer_status}")

            except Exception as e:
                logger.error(f"Status extraction error: {e}")

            return {
                "points": final_points,
                "badges": final_badges,
                "certifications": certifications,
                "agentblazer_status": agentblazer_status
            }

        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            return {"points": 0, "badges": 0, "error": str(e)}
            
        finally:
            await page.close()

# Global instance
scraper = TrailheadScraper()
