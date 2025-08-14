import os
from dataclasses import dataclass

from dotenv import load_dotenv

# Load .env if present (safe to call repeatedly)
load_dotenv()


@dataclass
class Settings:
    flask_env: str = os.getenv("FLASK_ENV", "production")
    flask_debug: bool = os.getenv("FLASK_DEBUG", "0") == "1"
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://lms_user:lms_pass@localhost:5432/lms_db",
    )


def get_settings() -> Settings:
    return Settings()
