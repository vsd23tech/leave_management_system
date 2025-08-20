from flask import Blueprint, render_template, url_for

# from yourapp.models import Department

bp = Blueprint("departments", __name__, url_prefix="/admin/departments")


@bp.route("/", methods=["GET"])
def departments_list():
    # Example: pull data from your DB
    # departments = Department.query.all()

    # Temporary dummy data for testing
    departments = [
        {
            "id": 1,
            "name": "HR",
            "code": "HR01",
            "status": "active",
            "description": "Human Resources",
            "parent": None,
        },
        {
            "id": 2,
            "name": "IT",
            "code": "IT01",
            "status": "inactive",
            "description": "Information Technology",
            "parent": None,
        },
    ]

    crumbs = [
        {"label": "Dashboard", "url": url_for("admin.dashboard")},
        {"label": "Departments", "url": None},
    ]

    return render_template(
        "admin/departments/index.html",
        crumbs=crumbs,
        departments=departments,
        total_count=len(departments),
    )
