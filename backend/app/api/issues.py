import os
import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from app.core.database import get_db
from app.core.config import settings
from app.core.deps import get_current_user, require_role, log_audit
from app.models.user import User
from app.models.issue import Issue, IssueImage, AIAnalysis, IssueStatusHistory
from app.models.notification import Notification
from app.models.department import Department
from app.schemas.issue import IssueOut, IssueDetailOut, IssueVerify, IssueReopen
from app.ai.detector import ai_service
from app.core.files import validate_and_save_upload

router = APIRouter(prefix="/issues", tags=["Issues"])

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine formula to find distance in meters between two coordinates"""
    R = 6371000  # radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.post("", response_model=IssueDetailOut)
async def report_issue(
    request: Request,
    category: str = Form(...),
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: str = Form(...),
    ward: str = Form("Ward 4"),
    image: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    uploaded_url = await validate_and_save_upload(image, prefix="issue")
    saved_image_url = uploaded_url or (image_url if image_url and not image_url.startswith("blob:") else None)

    # Default fallback demo image if none provided
    if not saved_image_url:
        sample_images = {
            "pothole": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800",
            "garbage": "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=800",
            "streetlight": "https://images.unsplash.com/photo-1508873696983-2df570464756?w=800",
            "water": "https://images.unsplash.com/photo-1583508915901-b5f84c1dcde1?w=800"
        }
        for k, v in sample_images.items():
            if k in category.lower():
                saved_image_url = v
                break
        if not saved_image_url:
            saved_image_url = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800"

    # Run AI Analysis
    ai_result = ai_service.analyze_image(
        image_path=saved_image_url,
        hint_category=category
    )

    # Generate sequential unique Ticket Code: CV-1000 + count
    count = db.query(Issue).count()
    ticket_code = f"CV-{1042 + count}"

    # Check for possible duplicate nearby (pre-filtered within ~500m bounding box, then precise Haversine)
    lat_delta = 0.005
    lon_delta = 0.005
    recent_issues = db.query(Issue).filter(
        Issue.category == category,
        Issue.status != "CLOSED",
        Issue.latitude.between(latitude - lat_delta, latitude + lat_delta),
        Issue.longitude.between(longitude - lon_delta, longitude + lon_delta)
    ).all()
    
    is_dup = False
    duplicate_of = None
    for existing in recent_issues:
        dist = calculate_distance(latitude, longitude, existing.latitude, existing.longitude)
        if dist < 200:  # within 200 meters
            is_dup = True
            duplicate_of = existing.id
            existing.duplicate_count += 1
            break

    # Determine default department based on category
    cat_dept_map = {
        "Pothole": "Road Maintenance",
        "Road Damage": "Road Maintenance",
        "Garbage": "Sanitation",
        "Streetlight Damage": "Electrical",
        "Water Leakage": "Water Supply",
        "Drainage Issue": "Drainage",
        "Fallen Tree": "Sanitation"
    }
    target_dept_name = cat_dept_map.get(category, "Road Maintenance")
    dept = db.query(Department).filter(Department.name == target_dept_name).first()

    # Initial priority based on AI severity
    severity_priority_map = {
        "CRITICAL": "CRITICAL",
        "HIGH": "HIGH",
        "MEDIUM": "MEDIUM",
        "LOW": "LOW"
    }
    initial_priority = severity_priority_map.get(ai_result["severity"], "MEDIUM")

    new_issue = Issue(
        ticket_code=ticket_code,
        citizen_id=current_user.id,
        category=category,
        description=description,
        image_url=saved_image_url,
        latitude=latitude,
        longitude=longitude,
        address=address,
        ward=ward,
        ai_classification=ai_result["category"],
        ai_confidence=ai_result["confidence"],
        ai_severity=ai_result["severity"],
        ai_raw_data=ai_result,
        priority=initial_priority,
        department_id=dept.id if dept else None,
        status="REPORTED",
        is_duplicate=is_dup,
        duplicate_of_id=duplicate_of
    )
    db.add(new_issue)
    db.flush()

    # Add Image record
    issue_img = IssueImage(
        issue_id=new_issue.id,
        image_url=saved_image_url,
        image_type="CITIZEN_REPORT"
    )
    db.add(issue_img)

    # Add AI analysis record
    ai_record = AIAnalysis(
        issue_id=new_issue.id,
        model_name=ai_result["model_name"],
        is_demo_mode=ai_result["is_demo_mode"],
        predicted_category=ai_result["category"],
        confidence=ai_result["confidence"],
        severity=ai_result["severity"],
        detected_objects=ai_result["detected_objects"],
        inference_time_ms=ai_result["inference_time_ms"]
    )
    db.add(ai_record)

    # Add Status History
    status_entry = IssueStatusHistory(
        issue_id=new_issue.id,
        from_status=None,
        to_status="REPORTED",
        changed_by_id=current_user.id,
        comment="Citizen reported issue via web portal"
    )
    db.add(status_entry)

    # Create in-app notification for Manager
    managers = db.query(User).filter(User.roles.any(name="MANAGER")).all()
    for mgr in managers:
        db.add(Notification(
            user_id=mgr.id,
            title="New Issue Reported",
            message=f"{ticket_code}: {category} reported at {address} (AI Severity: {ai_result['severity']})",
            type="ISSUE",
            link=f"/manager/issues/{new_issue.id}"
        ))

    db.commit()
    db.refresh(new_issue)

    log_audit(db, action="ISSUE_CREATED", entity="Issue", entity_id=str(new_issue.id), user=current_user, new_value={"ticket": ticket_code, "category": category}, request=request)

    return new_issue

@router.get("", response_model=List[IssueOut])
def list_issues(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    ward: Optional[str] = None,
    my_reports: bool = False,
    limit: int = Query(100, le=500),
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Issue)

    # If citizen requesting "my reports" or if citizen without manager role
    is_manager_or_admin = any(r.name in ["MANAGER", "ADMIN"] for r in current_user.roles)
    if my_reports or (not is_manager_or_admin):
        query = query.filter(Issue.citizen_id == current_user.id)

    if status and status != "ALL":
        query = query.filter(Issue.status == status)
    if priority and priority != "ALL":
        query = query.filter(Issue.priority == priority)
    if category and category != "ALL":
        query = query.filter(Issue.category == category)
    if ward and ward != "ALL":
        query = query.filter(Issue.ward == ward)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Issue.ticket_code.ilike(search_filter),
                Issue.description.ilike(search_filter),
                Issue.address.ilike(search_filter),
                Issue.category.ilike(search_filter)
            )
        )

    return query.order_by(desc(Issue.created_at)).offset(skip).limit(limit).all()

@router.get("/{id}", response_model=IssueDetailOut)
def get_issue_detail(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    # If citizen, ensure they only view their own issues unless public view is allowed
    is_staff_or_admin = any(r.name in ["MANAGER", "ADMIN"] for r in current_user.roles)
    if not is_staff_or_admin and issue.citizen_id != current_user.id:
        pass # Allow citizens to view civic details for transparency

    # Find possible duplicate reports nearby
    possible_duplicates = db.query(Issue).filter(
        Issue.id != issue.id,
        Issue.category == issue.category,
        Issue.status != "CLOSED"
    ).limit(5).all()

    # Filter to nearby within 400m
    near_duplicates = [
        dup for dup in possible_duplicates 
        if calculate_distance(issue.latitude, issue.longitude, dup.latitude, dup.longitude) < 400
    ]

    issue.possible_duplicates = near_duplicates
    return issue

@router.post("/{id}/verify", response_model=IssueDetailOut)
def verify_issue(
    id: int,
    verify_data: IssueVerify,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))
):
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    old_status = issue.status
    issue.verified_category = verify_data.verified_category
    issue.priority = verify_data.priority
    issue.department_id = verify_data.department_id
    issue.manager_notes = verify_data.manager_notes
    issue.is_verified_by_manager = True
    issue.verified_by_id = current_user.id
    issue.status = "VERIFIED"
    issue.updated_at = datetime.now(timezone.utc)

    # Status History
    status_entry = IssueStatusHistory(
        issue_id=issue.id,
        from_status=old_status,
        to_status="VERIFIED",
        changed_by_id=current_user.id,
        comment=f"Verified by Manager {current_user.full_name}: Priority {verify_data.priority}"
    )
    db.add(status_entry)

    # Notify Citizen
    if issue.citizen_id:
        db.add(Notification(
            user_id=issue.citizen_id,
            title="Issue Verified by Manager",
            message=f"Your reported issue {issue.ticket_code} has been verified and assigned priority {verify_data.priority}.",
            type="ISSUE",
            link=f"/citizen/report/{issue.id}"
        ))

    db.commit()
    db.refresh(issue)

    log_audit(db, action="ISSUE_VERIFIED", entity="Issue", entity_id=str(issue.id), user=current_user, new_value={"status": "VERIFIED", "priority": verify_data.priority}, request=request)

    return issue

@router.post("/{id}/reopen", response_model=IssueDetailOut)
def reopen_issue(
    id: int,
    reopen_data: IssueReopen,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    is_admin_or_mgr = any(r.name in ["ADMIN", "MANAGER"] for r in current_user.roles)
    if not is_admin_or_mgr and issue.citizen_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only the reporting citizen or an authorized municipal manager can reopen this issue."
        )

    if issue.status not in ["RESOLVED", "CLOSED", "COMPLETED", "VERIFICATION"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reopen issue with status '{issue.status}'. Only resolved or completed issues can be reopened."
        )

    old_status = issue.status
    issue.status = "REOPENED"
    issue.updated_at = datetime.now(timezone.utc)

    db.add(IssueStatusHistory(
        issue_id=issue.id,
        from_status=old_status,
        to_status="REOPENED",
        changed_by_id=current_user.id,
        comment=f"Reopened by citizen: {reopen_data.reason}"
    ))

    # Notify Managers
    managers = db.query(User).filter(User.roles.any(name="MANAGER")).all()
    for mgr in managers:
        db.add(Notification(
            user_id=mgr.id,
            title="Issue Reopened by Citizen",
            message=f"Issue {issue.ticket_code} was reopened: {reopen_data.reason}",
            type="ALERT",
            link=f"/manager/issues/{issue.id}"
        ))

    db.commit()
    db.refresh(issue)

    log_audit(db, action="ISSUE_REOPENED", entity="Issue", entity_id=str(issue.id), user=current_user, new_value={"reason": reopen_data.reason}, request=request)

    return issue
