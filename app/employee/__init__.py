from flask import Blueprint

bp = Blueprint("employee", __name__, url_prefix="/employee")

# import routes to register endpoints
from . import dashboard, routes  # noqa: E402,F401
