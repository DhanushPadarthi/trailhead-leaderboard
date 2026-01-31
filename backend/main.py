from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import io
import shutil
import asyncio
from typing import List, Optional
from dotenv import load_dotenv
import os
import logging

# Configure logging for better visibility in Render
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file (for local development)
load_dotenv()

from database import students_collection
from scraper import scraper # Import the global scraper instance

app = FastAPI()

# Concurrency limit for scraping
SCRAPE_SEMAPHORE = asyncio.Semaphore(10)  # Limit to 10 concurrent tabs

@app.on_event("startup")
async def startup_event():
    print("Starting up: Initializing browser...")
    await scraper.start()

@app.on_event("shutdown")
async def shutdown_event():
    print("Shutting down: Closing browser...")
    await scraper.stop()

# CORS configuration - updated for Vercel deployment
origins = [
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",  # Next.js default
    "https://dhanushtrailheadleaderboard.vercel.app",  # Production Vercel URL
    "https://dhanushtrailheadleaderboard-3u3kbj9z3.vercel.app",  # Vercel preview URL
    "https://dhanushtrailheadleaderboard-g7pj6868w.vercel.app",  # Vercel deployment
    "https://dhanushtrailheadleaderboard-htgwaqj0v.vercel.app",  # Vercel deployment
    "https://dhanushtrailheadleaderboard-b3pc9psih.vercel.app",  # Vercel deployment
    "https://dhanushtrailheadlderboard.vercel.app",  # Latest Vercel deployment
    "https://khaki-swans-call.loca.lt",  # localtunnel URL
    "https://trailhead-leaderboard.onrender.com",  # Render backend URL
    "http://localhost:8000",  # Backend itself
    "*"  # Allow all (for development)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Student(BaseModel):
    roll_number: str
    name: Optional[str] = None
    profile_url: str
    points: int = 0
    badges: int = 0
    rank: int = 0
    certifications: List[str] = []
    agentblazer_status: List[str] = []

async def process_student_scrape(roll_number: str, url: str):
    """
    Async background task to scrape data and update DB.
    Uses a semaphore to limit concurrent browser pages.
    """
    async with SCRAPE_SEMAPHORE:
        logger.info(f"🔄 Starting scrape for {roll_number} - URL: {url}")
        try:
            data = await scraper.scrape_profile(url)
            
            update_data = {
                "points": data.get("points", 0),
                "badges": data.get("badges", 0),
                "certifications": data.get("certifications", []),
                "agentblazer_status": data.get("agentblazer_status", []),
                "last_updated": pd.Timestamp.now().isoformat(),
                "is_scraping": False
            }
            
            if "error" in data:
                update_data["scrape_error"] = data["error"]
                logger.warning(f"⚠️  Scrape error for {roll_number}: {data['error']}")
            else:
                logger.info(f"✅ Successfully scraped {roll_number}: {data.get('points', 0)} points, {data.get('badges', 0)} badges")
            
            students_collection.update_one(
                {"roll_number": roll_number},
                {"$set": update_data}
            )
        except Exception as e:
            logger.error(f"❌ Error processing scrape for {roll_number}: {e}")
            students_collection.update_one(
                {"roll_number": roll_number},
                {"$set": {"is_scraping": False, "scrape_error": str(e)}}
            )

@app.post("/upload")
async def upload_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Upload Excel file containing Roll Number and Profile URL.
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload Excel file.")

    contents = await file.read()
    try:
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read Excel file: {str(e)}")

    # Normalize column names
    df.columns = [c.strip().lower() for c in df.columns]
    
    # Check required columns. Flexible matching
    roll_col = next((c for c in df.columns if 'roll' in c), None)
    url_col = next((c for c in df.columns if 'url' in c or 'link' in c or 'profile' in c), None)
    name_col = next((c for c in df.columns if 'name' in c), None) # Optional

    if not roll_col or not url_col:
        raise HTTPException(status_code=400, detail="Excel must contain columns for 'Roll Number' and 'Profile URL'")

    # Track duplicates but don't remove them - they'll be identified in the export
    # Each upload will update existing records with the new data

    tasks_started = 0
    for _, row in df.iterrows():
        roll = str(row[roll_col]).strip()
        url = str(row[url_col]).strip()
        name = str(row[name_col]).strip() if name_col and pd.notna(row[name_col]) else ""

        if not url or pd.isna(url):
            continue

        # Upsert student into DB as placeholder
        student_doc = {
            "roll_number": roll,
            "profile_url": url,
            "name": name
        }
        # Only set default points/badges if new document
        students_collection.update_one(
            {"roll_number": roll},
            {"$set": student_doc, "$setOnInsert": {"points": 0, "badges": 0, "certifications": [], "agentblazer_status": []}},
            upsert=True
        )

        # Trigger background scrape
        background_tasks.add_task(process_student_scrape, roll, url)
        tasks_started += 1

    return {"message": f"Processing {tasks_started} students in background."}

@app.get("/students")
def get_leaderboard():
    """
    Get sorted leaderboard.
    """
    students = list(students_collection.find({}, {"_id": 0}))
    
    students_cursor = students_collection.find({}, {"_id": 0}).sort([("points", -1), ("badges", -1)])
    students_list = list(students_cursor)
    
    # Add rank
    for idx, s in enumerate(students_list):
        s["rank"] = idx + 1
        
    return students_list

@app.post("/scrape/{roll_number}")
async def force_scrape(roll_number: str, background_tasks: BackgroundTasks):
    student = students_collection.find_one({"roll_number": roll_number})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Set status to scraping immediately
    students_collection.update_one(
        {"roll_number": roll_number},
        {"$set": {"is_scraping": True}}
    )

    background_tasks.add_task(process_student_scrape, roll_number, student["profile_url"])
    return {"message": f"Scrape started for {roll_number}"}

@app.post("/scrape-all")
async def force_scrape_all(background_tasks: BackgroundTasks):
    """
    Triggers a background scrape for ALL students in the database.
    """
    students = list(students_collection.find({}, {"roll_number": 1, "profile_url": 1}))
    
    # Set all to scraping
    students_collection.update_many(
        {}, 
        {"$set": {"is_scraping": True}}
    )

    count = 0
    for s in students:
        if "profile_url" in s and s["profile_url"]:
            background_tasks.add_task(process_student_scrape, s["roll_number"], s["profile_url"])
            count += 1
    
    return {"message": f"Started background scrape for {count} students."}

from fastapi.responses import Response

@app.get("/export")
async def export_leaderboard():
    """
    Export leaderboard to Excel.
    """
    # Get all students sorted
    students_cursor = students_collection.find({}, {"_id": 0}).sort([("points", -1), ("badges", -1)])
    students = list(students_cursor)
    
    # Create DataFrames
    public_data = []
    private_data = []
    invalid_url_data = []
    
    # Find duplicates in the database (same roll number appearing multiple times)
    from collections import Counter
    all_roll_numbers = [s.get("roll_number", "") for s in students]
    roll_counter = Counter(all_roll_numbers)
    duplicate_rolls = {roll for roll, count in roll_counter.items() if count > 1}
    duplicate_data = []

    for idx, s in enumerate(students):
        # Flatten stats
        champion = "Yes" if "Champion 2026" in str(s.get("agentblazer_status", [])) else "No"
        innovator = "Yes" if "Innovator 2026" in str(s.get("agentblazer_status", [])) else "No"
        legend = "Yes" if "Legend 2026" in str(s.get("agentblazer_status", [])) else "No"
        
        url = s.get("profile_url", "")
        # Basic validation check for Salesforce/Trailhead URL
        is_trailhead = "trailblazer.me" in url or "salesforce.com/trailblazer" in url
        
        # Check if profile is private/error
        is_private = "Access Denied" in str(s.get("scrape_error", "")) or "Profile content not found" in str(s.get("scrape_error", "")) or s.get("points", 0) == 0

        row = {
            "Rank": idx + 1 if not is_private and is_trailhead else "N/A",
            "Roll Number": s.get("roll_number", ""),
            "Name": s.get("name", ""),
            "Points": s.get("points", 0),
            "Badges": s.get("badges", 0),
            "Certifications": ", ".join(s.get("certifications", [])),
            "Champion 2026": champion,
            "Innovator 2026": innovator,
            "Legend 2026": legend,
            "Profile URL": url,
            "Status": "Public"
        }
        
        if not is_trailhead:
             row["Status"] = "Invalid URL"
             invalid_url_data.append(row)
        elif is_private:
            row["Status"] = "Private/Error"
            private_data.append(row)
        else:
            public_data.append(row)
        
        # Track if this is a duplicate roll number
        if s.get("roll_number", "") in duplicate_rolls:
            dup_row = row.copy()
            dup_row["Duplicate_Issue"] = "Duplicate Roll Number"
            duplicate_data.append(dup_row)
        
    df_public = pd.DataFrame(public_data)
    df_private = pd.DataFrame(private_data)
    df_invalid = pd.DataFrame(invalid_url_data)
    df_duplicates = pd.DataFrame(duplicate_data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        if not df_public.empty:
            df_public.to_excel(writer, index=False, sheet_name='Leaderboard')
        if not df_private.empty:
            df_private.to_excel(writer, index=False, sheet_name='Private Profiles')
        if not df_invalid.empty:
            df_invalid.to_excel(writer, index=False, sheet_name='Invalid URLs')
        if not df_duplicates.empty:
            df_duplicates.to_excel(writer, index=False, sheet_name='Duplicates')
        
    output.seek(0)
    
    headers = {
        'Content-Disposition': 'attachment; filename="leaderboard.xlsx"'
    }
    return Response(content=output.getvalue(), media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers=headers)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
