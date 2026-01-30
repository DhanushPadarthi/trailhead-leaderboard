from pymongo import MongoClient
import os
from urllib.parse import quote_plus

# MongoDB Atlas configuration
# Get credentials from environment variables (for Render deployment)
# Or use default values for local development
MONGODB_USERNAME = os.getenv("MONGODB_USERNAME", "padarthidhanush_db_user")
MONGODB_PASSWORD = os.getenv("MONGODB_PASSWORD", "YOUR_PASSWORD_HERE")  # Replace with actual password
MONGODB_CLUSTER = os.getenv("MONGODB_CLUSTER", "trailhead.ghxkwl0.mongodb.net")
DB_NAME = os.getenv("MONGODB_DATABASE", "trailhead_leaderboard")

# URL encode username and password to handle special characters
username_encoded = quote_plus(MONGODB_USERNAME)
password_encoded = quote_plus(MONGODB_PASSWORD)

# Construct MongoDB Atlas URI
MONGO_URI = f"mongodb+srv://{username_encoded}:{password_encoded}@{MONGODB_CLUSTER}/{DB_NAME}?retryWrites=true&w=majority"

# Connect to MongoDB Atlas
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
students_collection = db["students"]

def get_database():
    return db

