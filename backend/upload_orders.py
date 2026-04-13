import json
import retailcrm
from config import RETAILCRM_API_KEY, RETAILCRM_URL


with open("../data/mock_orders.json", "r", encoding="utf-8") as f:
    orders = json.load(f)

client = retailcrm.v5(RETAILCRM_URL,  RETAILCRM_API_KEY)

for order in orders:
    order.pop("orderType", None)

    result = client.order_create(order)

    if result and result.is_successful():
        print("✅ УСПЕХ")
    else:
        print("❌ ОШИБКА")
        print(result.get_errors())