from alembic.config import Config as AlembicConfig
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from flask import Flask, jsonify, render_template
from sqlalchemy import text

from app import db as dbmod
from app.admin import bp as admin_bp  # register admin endpoints
from app.config import get_settings
from app.logging_utils import configure_logging


def _migrations_status(engine):
    with engine.connect() as conn:
        ctx = MigrationContext.configure(conn)
        current = set(ctx.get_current_heads() or [])
    alembic_cfg = AlembicConfig("alembic.ini")
    heads = set(ScriptDirectory.from_config(alembic_cfg).get_heads() or [])
    return {"current": list(current), "head": list(heads), "up_to_date": current == heads}


def create_app():
    settings = get_settings()
    configure_logging(settings.log_level, settings.log_json)

    app = Flask(__name__)
    app.config["SECRET_KEY"] = settings.secret_key

    # DB init
    dbmod.init_engine(settings.database_url)

    @app.get("/healthz")
    def healthz():
        return jsonify(status="ok")

    @app.get("/dbcheck")
    def dbcheck():
        engine = dbmod.get_engine()
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return jsonify(database="ok")
        except Exception as e:
            return jsonify(database="error", detail=str(e)), 500

    @app.get("/readyz")
    def readyz():
        """Readiness probe: DB reachable and migrations at head."""
        engine = dbmod.get_engine()
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            mig = _migrations_status(engine)
            code = 200 if mig["up_to_date"] else 503
            return (
                jsonify(
                    status="ok" if mig["up_to_date"] else "migrations_pending",
                    migrations=mig,
                ),
                code,
            )
        except Exception as e:
            return jsonify(status="error", detail=str(e)), 503

    @app.get("/")
    def home():
        return render_template("base.html")

    # Blueprints
    app.register_blueprint(admin_bp)

    # Release scoped session at end of request
    @app.teardown_appcontext
    def remove_session(exc=None):
        try:
            dbmod.get_session().remove()
        except Exception:  # nosec B110
            pass

    return app
