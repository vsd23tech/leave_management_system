from flask import Blueprint

bp = Blueprint("admin", __name__, url_prefix="/admin")

# import routes to register endpoints
from . import routes  # noqa: E402,F401
