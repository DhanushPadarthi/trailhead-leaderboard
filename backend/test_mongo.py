from pymongo import MongoClient
import sys

try:
    client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
    db = client["trailhead_leaderboard"]
    settings = db["settings"].find_one({"_id": "maintenance"})
    print(f"Maintenance Settings: {settings}")
except Exception as e:
    print(f"MongoDB connection failed: {e}")
