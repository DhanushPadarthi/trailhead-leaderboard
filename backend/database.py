from pymongo import MongoClient
import os

# Connect to local MongoDB
# Assuming default port 27017
# "mongo compass" usually connects to localhost:27017
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "trailhead_leaderboard"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
students_collection = db["students"]

def get_database():
    return db
