import csv
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_role
from app.models.user import User
from app.models.issue import Issue
from app.models.staff import Staff
from app.models.feedback import CitizenFeedback
from app.models.department import Department

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/issues/csv")
def export_issues_csv(db: Session = Depends(get_db), current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Ticket Code", "Category", "Priority", "Status", "Ward", "Address", "AI Category", "AI Confidence", "Created At", "Resolved At"])

    issues = db.query(Issue).all()
    for i in issues:
        writer.writerow([
            i.ticket_code,
            i.category,
            i.priority,
            i.status,
            i.ward,
            i.address,
            i.ai_classification or "N/A",
            f"{int((i.ai_confidence or 0)*100)}%" if i.ai_confidence else "N/A",
            i.created_at.strftime("%Y-%m-%d %H:%M"),
            i.resolved_at.strftime("%Y-%m-%d %H:%M") if i.resolved_at else "Unresolved"
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=civiceye_issues_report.csv"}
    )

@router.get("/staff/csv")
def export_staff_csv(db: Session = Depends(get_db), current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Employee ID", "Name", "Department", "Designation", "Status", "Tasks Assigned", "Tasks Completed", "Tasks Pending", "Attendance %", "Rating"])

    staff_list = db.query(Staff).all()
    for s in staff_list:
        writer.writerow([
            s.employee_id,
            s.name,
            s.department.name if s.department else "General",
            s.designation,
            s.employment_status,
            s.tasks_assigned,
            s.tasks_completed,
            s.tasks_pending,
            f"{s.attendance_rate}%",
            f"{s.citizen_rating}/5.0"
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=civiceye_staff_workload_report.csv"}
    )

@router.get("/feedback/csv")
def export_feedback_csv(db: Session = Depends(get_db), current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Ticket Code", "Citizen Name", "Resolved Status", "Rating (1-5)", "Comment", "Date"])

    feedbacks = db.query(CitizenFeedback).all()
    for f in feedbacks:
        writer.writerow([
            f.issue.ticket_code if f.issue else "N/A",
            f.citizen.full_name if f.citizen else "Citizen",
            f.resolved_status,
            f.rating,
            f.comment or "",
            f.created_at.strftime("%Y-%m-%d %H:%M")
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=civiceye_citizen_feedback_report.csv"}
    )
