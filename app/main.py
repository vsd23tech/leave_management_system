from flask import Flask, jsonify
from app.config import get_settings
from app import db as dbmod

def create_app():
    settings = get_settings()
    app = Flask(__name__)

    # --- DB init (lazy-safe) ---
    dbmod.init_engine(settings.database_url)

    @app.get("/healthz")
    def healthz():
        return jsonify(status="ok")

    @app.get("/dbcheck")
    def dbcheck():
        """Lightweight DB connectivity check (no migrations yet)."""
        engine = dbmod.get_engine()
        try:
            with engine.connect() as conn:
                conn.exec_driver_sql("SELECT 1")
            return jsonify(database="ok")
        except Exception as e:
            # Keep it simple and transparent for dev
            return jsonify(database="error", detail=str(e)), 500

    return app
