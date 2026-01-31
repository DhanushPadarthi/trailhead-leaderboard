from pymongo import MongoClient
import os
from urllib.parse import quote_plus

# MongoDB connection
# Default to local MongoDB if no environment variable is set
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DATABASE", "trailhead_leaderboard")

# Connect to MongoDB
try:
    client = MongoClient(MONGO_URI)
    # Verify connection
    client.admin.command('ismaster')
    print(f"Connected to MongoDB at {MONGO_URI}")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    # Fallback/Default for safe failure or logging
    
db = client[DB_NAME]
students_collection = db["students"]

def get_database():
    return db

