from flask import render_template

from . import bp  # blueprint from app/admin/__init__.py


@bp.route("/dashboard")
def dashboard():
    # We'll wire real data later; the JS shows demo numbers for now.
    return render_template("admin/dashboard.html")
