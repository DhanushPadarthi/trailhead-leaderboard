from pymongo import MongoClient
import sys

try:
    client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
    client.admin.command('ping')
    print("MongoDB connection successful!")
except Exception as e:
    print(f"MongoDB connection failed: {e}")
