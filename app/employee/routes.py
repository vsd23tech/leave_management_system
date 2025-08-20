from flask import jsonify, render_template

from . import bp


@bp.route("/leave/apply")
def apply_leave():
    """Apply for leave form"""
    return render_template("employee/leave/apply.html")


@bp.route("/leave/cancel")
def cancel_leave():
    """Cancel leave request"""
    return render_template("employee/leave/cancel.html")


@bp.route("/leave/history")
def leave_history():
    """Leave history and balance"""
    return render_template("employee/leave/history.html")


@bp.route("/profile")
def profile():
    """Employee profile and settings"""
    return render_template("employee/profile.html")


@bp.route("/api/leave-balance")
def get_leave_balance():
    """API endpoint for leave balance data"""
    # TODO: Implement actual data fetching from database
    return jsonify(
        {"available_balance": 18, "used_this_fy": 12, "open_requests": 3, "awaiting_approval": 2}
    )
