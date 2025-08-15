import os
from dataclasses import dataclass

from dotenv import load_dotenv

# Load .env from the project root if present (safe; won't override existing env by default)
load_dotenv()

IN_CONTAINER = os.getenv("IN_CONTAINER", "0") == "1"


def _compose_db_url_from_parts() -> str:
    # Default host depends on where we run
    default_host = "db" if IN_CONTAINER else "localhost"
    host = os.getenv("DB_HOST", default_host)
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "lms_db")
    user = os.getenv("DB_USER", "lms_user")
    pwd = os.getenv("DB_PASSWORD", "lms_pass")
    return f"postgresql+psycopg2://{user}:{pwd}@{host}:{port}/{name}"


@dataclass
class Settings:
    flask_env: str = os.getenv("FLASK_ENV", "production")
    flask_debug: bool = os.getenv("FLASK_DEBUG", "0") == "1"

    # Priority order:
    # - In container: DATABASE_URL_DOCKER, then DATABASE_URL, else build one (host=db)
    # - Locally: DATABASE_URL, then DATABASE_URL_DOCKER, else build one (host=localhost)
    if IN_CONTAINER:
        database_url: str = (
            os.getenv("DATABASE_URL_DOCKER")
            or os.getenv("DATABASE_URL")
            or _compose_db_url_from_parts()
        )
    else:
        database_url: str = (
            os.getenv("DATABASE_URL")
            or os.getenv("DATABASE_URL_DOCKER")
            or _compose_db_url_from_parts()
        )

    secret_key: str = os.getenv("SECRET_KEY", "dev-secret-not-for-prod")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    log_json: bool = os.getenv("LOG_JSON", "0") == "1"


def get_settings() -> Settings:
    return Settings()
