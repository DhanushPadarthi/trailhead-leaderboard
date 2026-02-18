import asyncio
import json
import os
import sys
from datetime import datetime

# Ensure the script can find scraper.py in the same directory
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

try:
    from scraper import scraper
except ImportError:
    # Fallback if specific package structure is used
    sys.path.append(os.path.join(current_dir, ".."))
    from backend.scraper import scraper

async def main():
    # Define path to the static JSON file used by frontend
    # Relative to: backend/daily_scrape.py -> ../frontend/public/static-data.json
    json_path = os.path.join(current_dir, '..', 'frontend', 'public', 'static-data.json')
    json_path = os.path.abspath(json_path)
    
    if not os.path.exists(json_path):
        print(f"❌ Error: File not found at {json_path}")
        return

    print(f"📂 Loading data from: {json_path}")
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            students = json.load(f)
    except Exception as e:
        print(f"❌ Error loading JSON: {e}")
        return

    print(f"🚀 Starting daily scrape for {len(students)} students...")
    await scraper.start()
    
    # Use a semaphore to limit concurrent browser tabs (GitHub Actions is resource constrained)
    sem = asyncio.Semaphore(3)
    
    updated_count = 0
    
    async def process_student(student):
        nonlocal updated_count
        async with sem:
            url = student.get('profile_url')
            # Skip invalid/missing URLs
            if not url or "salesforce.com" not in url:
                return

            print(f"🔍 Scraping {student.get('roll_number', 'Unknown')}")
            try:
                # Scrape data
                data = await scraper.scrape_profile(url)
                
                # Update student record
                student['points'] = data.get('points', 0)
                student['badges'] = data.get('badges', 0)
                student['certifications'] = data.get('certifications', [])
                student['agentblazer_status'] = data.get('agentblazer_status', [])
                
                # Update status flags
                student['scrape_error'] = data.get('error')
                student['is_scraping'] = False
                student['last_updated'] = datetime.now().isoformat()
                
                updated_count += 1
                
            except Exception as e:
                print(f"⚠️ Error scraping {url}: {e}")
                student['scrape_error'] = str(e)

    # Create and run all tasks
    tasks = [process_student(s) for s in students]
    await asyncio.gather(*tasks)

    print("🛑 Closing browser...")
    await scraper.stop()

    # Recalculate Ranks
    print("📊 Recalculating ranks...")
    try:
        # Sort by Points (desc), then Badges (desc)
        students.sort(key=lambda x: (x.get('points', 0), x.get('badges', 0)), reverse=True)
        
        # Assign ranks
        for idx, s in enumerate(students):
            s['rank'] = idx + 1
            
    except Exception as e:
        print(f"⚠️ Error sorting/ranking: {e}")

    # Save updated data
    print(f"💾 Saving {updated_count} updated records to {json_path}")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(students, f, indent=4)
    
    print("✅ Daily scrape completed successfully.")

if __name__ == "__main__":
    asyncio.run(main())
