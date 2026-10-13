from datetime import datetime, timezone, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.deps import get_current_user, require_role, log_audit
from app.models.user import User, Role
from app.models.staff import Staff, AdministrativeAction, StaffAttendance
from app.models.department import Department
from app.schemas.staff import StaffCreate, StaffUpdate, StaffOut, AdminActionCreate, AdminActionOut

router = APIRouter(prefix="/staff", tags=["Staff Management"])

@router.get("", response_model=List[StaffOut])
def list_staff(
    department_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))
):
    query = db.query(Staff)
    if department_id:
        query = query.filter(Staff.department_id == department_id)
    if status and status != "ALL":
        query = query.filter(Staff.employment_status == status)
    if search:
        s = f"%{search}%"
        query = query.filter((Staff.name.ilike(s)) | (Staff.employee_id.ilike(s)) | (Staff.designation.ilike(s)))

    staff_list = query.order_by(Staff.id).all()
    results = []
    for s in staff_list:
        out = StaffOut.model_validate(s)
        out.department_name = s.department.name if s.department else "General"
        results.append(out)
    return results

@router.post("", response_model=StaffOut)
def create_staff(
    staff_in: StaffCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))
):
    dept = db.query(Department).filter(Department.id == staff_in.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    count = db.query(Staff).count()
    emp_id = f"EMP-{1000 + count + 1}"

    new_staff = Staff(
        employee_id=emp_id,
        name=staff_in.name,
        email=staff_in.email,
        phone=staff_in.phone,
        department_id=staff_in.department_id,
        designation=staff_in.designation,
        employment_status=staff_in.employment_status or "ACTIVE",
        avatar_url=staff_in.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={staff_in.name}",
        notes=staff_in.notes
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)

    log_audit(db, action="STAFF_CREATED", entity="Staff", entity_id=str(new_staff.id), user=current_user, new_value={"name": staff_in.name, "dept": dept.name}, request=request)

    out = StaffOut.model_validate(new_staff)
    out.department_name = dept.name
    return out

@router.get("/managers/directory")
def get_managers_directory(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))
):
    results = []
    staff_members = db.query(Staff).all()
    seen_emails = set()

    for s in staff_members:
        email = s.email or (s.user.email if s.user else "")
        if email:
            seen_emails.add(email.lower())

        dept_name = s.department.name if s.department else "General"
        city = "Metro Central"
        location = "Civic Operations Hub"
        if s.notes and "City:" in s.notes:
            parts = s.notes.split("City:")
            city = parts[1].split(";")[0].strip() if len(parts) > 1 else parts[1].strip()
        if s.notes and "Location:" in s.notes:
            parts = s.notes.split("Location:")
            location = parts[1].split(";")[0].strip() if len(parts) > 1 else parts[1].strip()

        results.append({
            "id": s.id,
            "name": s.name,
            "avatar": s.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={s.name}",
            "title": s.designation or "Civic Operations Manager",
            "city": city,
            "location": location,
            "phone": s.phone or "+1 (555) 000-0000",
            "email": email or f"staff{s.id}@civiceye.local",
            "department": dept_name,
            "status": s.employment_status or "ACTIVE",
            "issuesResolved": s.tasks_completed or 0,
            "activeWorkOrders": s.tasks_pending or 0,
            "responseTimeAvg": f"{s.avg_completion_hours or 2.5:.1f} hrs",
            "joinedDate": s.joining_date.strftime("%B %Y") if s.joining_date else "Recently",
            "badge": "Operations Lead" if (s.tasks_completed or 0) > 10 else "Civic Manager",
            "badgeColor": "text-teal-600 bg-teal-50 border-teal-200"
        })

    all_users = db.query(User).all()
    for u in all_users:
        user_roles = [r.name.upper() for r in u.roles] if u.roles else []
        if ("MANAGER" in user_roles or "ADMIN" in user_roles) and u.email.lower() not in seen_emails:
            seen_emails.add(u.email.lower())
            results.append({
                "id": u.id,
                "name": u.full_name or "Civic Administrator",
                "avatar": u.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={u.full_name or 'Admin'}",
                "title": "Senior Civic Administrator" if "ADMIN" in user_roles else "Regional Civic Manager",
                "city": "Capital Headquarters",
                "location": "City Operations Directorate",
                "phone": u.phone_number or "+1 (555) 010-0000",
                "email": u.email,
                "department": "Executive Operations",
                "status": "ACTIVE" if u.is_active else "INACTIVE",
                "issuesResolved": 0,
                "activeWorkOrders": 0,
                "responseTimeAvg": "1.5 hrs",
                "joinedDate": u.created_at.strftime("%B %Y") if u.created_at else "Recently",
                "badge": "System Admin" if "ADMIN" in user_roles else "Regional Manager",
                "badgeColor": "text-purple-600 bg-purple-50 border-purple-200" if "ADMIN" in user_roles else "text-teal-600 bg-teal-50 border-teal-200"
            })

    return results

@router.get("/{id}", response_model=StaffOut)
def get_staff_detail(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))):
    staff = db.query(Staff).filter(Staff.id == id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    out = StaffOut.model_validate(staff)
    out.department_name = staff.department.name if staff.department else "General"
    return out

@router.put("/{id}", response_model=StaffOut)
def update_staff(
    id: int,
    staff_in: StaffUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))
):
    staff = db.query(Staff).filter(Staff.id == id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    old_status = staff.employment_status

    if staff_in.name is not None:
        staff.name = staff_in.name
    if staff_in.email is not None:
        staff.email = staff_in.email
    if staff_in.phone is not None:
        staff.phone = staff_in.phone
    if staff_in.department_id is not None:
        staff.department_id = staff_in.department_id
    if staff_in.designation is not None:
        staff.designation = staff_in.designation
    if staff_in.employment_status is not None:
        staff.employment_status = staff_in.employment_status
    if staff_in.notes is not None:
        staff.notes = staff_in.notes

    db.commit()
    db.refresh(staff)

    log_audit(db, action="STAFF_UPDATED", entity="Staff", entity_id=str(staff.id), user=current_user, old_value={"status": old_status}, new_value={"status": staff.employment_status}, request=request)

    out = StaffOut.model_validate(staff)
    out.department_name = staff.department.name if staff.department else "General"
    return out

@router.post("/{id}/admin-action", response_model=AdminActionOut)
def create_administrative_action(
    id: int,
    action_in: AdminActionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))
):
    staff = db.query(Staff).filter(Staff.id == id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    admin_action = AdministrativeAction(
        staff_id=id,
        action_type=action_in.action_type,
        reason=action_in.reason,
        evidence_url=action_in.evidence_url,
        created_by_id=current_user.id,
        reviewer_id=current_user.id,
        is_approved=True,
        final_status="RECORDED"
    )
    db.add(admin_action)

    # If action is suspension or dismissal, update employment status without deleting historical record
    if action_in.action_type == "SUSPENSION":
        staff.employment_status = "SUSPENDED"
    elif action_in.action_type == "DISMISSAL":
        staff.employment_status = "TERMINATED"

    db.commit()
    db.refresh(admin_action)

    log_audit(db, action="ADMINISTRATIVE_ACTION", entity="Staff", entity_id=str(staff.id), user=current_user, new_value={"action": action_in.action_type, "reason": action_in.reason}, request=request)

    out = AdminActionOut.model_validate(admin_action)
    out.staff_name = staff.name
    return out

@router.get("/{id}/admin-actions", response_model=List[AdminActionOut])
def get_staff_admin_actions(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))):
    actions = db.query(AdministrativeAction).filter(AdministrativeAction.staff_id == id).order_by(desc(AdministrativeAction.timestamp)).all()
    results = []
    staff = db.query(Staff).filter(Staff.id == id).first()
    for a in actions:
        out = AdminActionOut.model_validate(a)
        out.staff_name = staff.name if staff else "N/A"
        results.append(out)
    return results
