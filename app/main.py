from flask import Flask, jsonify, render_template

from app import db as dbmod
from app.admin import bp as admin_bp  # at top with other imports
from app.config import get_settings


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

    @app.get("/")
    def home():
        return render_template("base.html")

    app.register_blueprint(admin_bp)

    @app.teardown_appcontext
    def remove_session(exc=None):
        # release the scoped session at the end of request
        try:
            dbmod.get_session().remove()
        except Exception:
            # Ignore cleanup errors during shutdown
            pass  # nosec B110

    return app
