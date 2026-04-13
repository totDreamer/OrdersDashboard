import os
from dotenv import load_dotenv

load_dotenv()

RETAILCRM_API_KEY = os.getenv("RETAILCRM_API_KEY")
RETAILCRM_URL = os.getenv("RETAILCRM_URL")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")