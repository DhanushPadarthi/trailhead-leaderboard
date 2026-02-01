import json
from database import students_collection

# Fetch all students from MongoDB
students = list(students_collection.find({}, {"_id": 0}).sort([("points", -1), ("badges", -1)]))

# Add rank
for idx, s in enumerate(students):
    s["rank"] = idx + 1

# Write to frontend public folder
output_path = "../frontend/public/static-data.json"
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(students, f, indent=2, ensure_ascii=False)

print(f"Exported {len(students)} students to {output_path}")
