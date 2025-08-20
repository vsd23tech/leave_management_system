from flask import Blueprint

bp = Blueprint("admin", __name__, url_prefix="/admin")

# import routes to register endpoints
from . import dashboard, routes  # noqa: E402,F401
