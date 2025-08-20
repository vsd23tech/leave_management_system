from flask import render_template

from . import bp


@bp.route("/dashboard")
def dashboard():
    """Employee dashboard - main landing page for employees"""
    return render_template("employee/dashboard.html")
