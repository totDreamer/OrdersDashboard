import requests
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY, RETAILCRM_URL, RETAILCRM_API_KEY

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 1. ПРАВИЛЬНЫЙ REST запрос к RetailCRM
url = f"{RETAILCRM_URL}/api/v5/orders"

params = {
    "apiKey": RETAILCRM_API_KEY,
    "limit": 50,
    "page": 1
}

response = requests.get(url, params=params)

data = response.json()

print("RAW:", data)

if data.get("success"):
    orders = data.get("orders", [])

    for order in orders:
        record = {
            "number": order.get("number"),
            "total_sum": order.get("totalSumm", 0),
            "created_at": order.get("createdAt")
        }

        supabase.table("orders").upsert(record).execute()

    print("✅ SYNC DONE")

else:
    print("❌ RETAILCRM ERROR:", data)