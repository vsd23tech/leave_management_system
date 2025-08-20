from flask import render_template
from sqlalchemy import select

from app.db import get_session
from app.models.department import Department

from . import bp


@bp.route("/departments")
def list_departments():
    session = get_session()
    departments = session.execute(select(Department).order_by(Department.name)).scalars().all()
    return render_template("admin/departments/list.html", departments=departments)
