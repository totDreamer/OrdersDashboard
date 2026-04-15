import requests
from supabase import create_client
from config import (
    SUPABASE_URL,
    SUPABASE_KEY,
    RETAILCRM_URL,
    RETAILCRM_API_KEY,
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID,
)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

THRESHOLD = 50000


# =========================
# TELEGRAM
# =========================
def send_telegram(message: str):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("❌ Telegram config missing")
        return

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"

    response = requests.post(
        url, json={"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "HTML"}
    )

    print("📩 Telegram response:", response.text)


# =========================
# FETCH ORDERS
# =========================
url = f"{RETAILCRM_URL}/api/v5/orders"

params = {"apiKey": RETAILCRM_API_KEY, "limit": 50, "page": 1}

response = requests.get(url, params=params)
data = response.json()

print("RAW:", data)


if not data.get("success"):
    print("❌ RETAILCRM ERROR:", data)
    exit()


orders = data.get("orders", [])


# =========================
# PROCESS ORDERS
# =========================
for order in orders:
    order_number = order.get("number")
    total_sum = float(order.get("totalSumm") or 0)
    created_at = order.get("createdAt")

    record = {
        "number": order_number,
        "total_sum": total_sum,
        "created_at": created_at,
    }

    # 1. UPSERT (гарантируем что заказ есть в БД)
    supabase.table("orders").upsert(record, on_conflict="number").execute()

    print(f"📦 ORDER {order_number} | {total_sum}")

    # 2. читаем флаг уведомления
    db = (
        supabase.table("orders")
        .select("notified")
        .eq("number", order_number)
        .single()
        .execute()
    )

    already_notified = db.data.get("notified", False)

    # 3. бизнес-условие
    is_big_order = total_sum >= THRESHOLD

    # 4. отправка Telegram (ТОЛЬКО 1 РАЗ)
    if is_big_order and not already_notified:
        print("🚀 SENDING TELEGRAM")

        send_telegram(
            f"💰 <b>Новый крупный заказ</b>\n"
            f"Сумма: {total_sum:,} ₸\n"
            f"Номер: {order_number}"
        )

        # 5. помечаем как уведомлённый
        supabase.table("orders").update({"notified": True}).eq(
            "number", order_number
        ).execute()

        print("✅ MARKED AS NOTIFIED")


print("✅ SYNC DONE")
