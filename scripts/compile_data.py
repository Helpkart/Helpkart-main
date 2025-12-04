import json
import os
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId

# Get MongoDB URI from environment
MONGODB_URI = os.environ.get("MONGODB_URI")
client = MongoClient(MONGODB_URI)
db = client["helpkart_db"]

def serialize(obj):
    """Convert MongoDB objects to JSON-serializable format"""
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    return str(obj)

def compile_data():
    """Fetch all data and compile to JSON"""
    
    print("📦 Fetching data from MongoDB...")
    
    # Fetch collections
    centers = list(db["centers"].find({}, {"password": 0}))  # Exclude passwords!
    inventory = list(db["inventory"].find({}))
    requests_list = list(db["requests"].find({}))
    transactions = list(db["transactions"].find({}))
    
    # Create compiled data
    compiled = {
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "total_centers": len(centers),
            "total_items": len(inventory),
            "open_requests": len([r for r in requests_list if not r.get("fulfilled")]),
            "transactions": len(transactions)
        },
        "data": {
            "centers": centers,
            "inventory": inventory,
            "requests": requests_list,
            "transactions": transactions
        }
    }
    
    # Save to file
    filename = f"exports/helpkart_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    os.makedirs("exports", exist_ok=True)
    
    with open(filename, "w") as f:
        json.dump(compiled, f, default=serialize, indent=2)
    
    print(f"✅ Data compiled: {filename}")

if __name__ == "__main__":
    try:
        compile_data()
    except Exception as e:
        print(f"❌ Error: {e}")
        exit(1)
