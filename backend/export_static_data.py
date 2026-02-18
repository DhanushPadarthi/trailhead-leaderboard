import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from database import students_collection

# Fetch all students from MongoDB
students = list(students_collection.find({}, {"_id": 0}).sort([("points", -1), ("badges", -1)]))

# Add rank
for idx, s in enumerate(students):
    s["rank"] = idx + 1

# Determine output path relative to this script
script_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(script_dir, "..", "frontend", "public", "static-data.json")

# Ensure directory exists
os.makedirs(os.path.dirname(output_path), exist_ok=True)

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(students, f, indent=4, ensure_ascii=False)

print(f"Exported {len(students)} students to {output_path}")
