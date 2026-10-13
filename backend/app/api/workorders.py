import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.config import settings
from app.core.deps import get_current_user, require_role, log_audit
from app.models.user import User
from app.models.issue import Issue, IssueStatusHistory, WorkEvidence
from app.models.workorder import WorkOrder
from app.models.staff import Staff
from app.models.department import Department
from app.models.notification import Notification
from app.schemas.workorder import WorkOrderCreate, WorkOrderStatusUpdate, WorkOrderOut, WorkEvidenceCreate

router = APIRouter(prefix="/work-orders", tags=["Work Orders"])

@router.post("", response_model=WorkOrderOut)
def create_work_order(
    order_in: WorkOrderCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))
):
    issue = db.query(Issue).filter(Issue.id == order_in.issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    worker = db.query(Staff).filter(Staff.id == order_in.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Staff worker not found")

    department = db.query(Department).filter(Department.id == order_in.department_id).first()

    count = db.query(WorkOrder).count()
    order_code = f"WO-{4000 + count + 1}"

    work_order = WorkOrder(
        order_code=order_code,
        issue_id=order_in.issue_id,
        department_id=order_in.department_id,
        worker_id=order_in.worker_id,
        manager_id=current_user.id,
        priority=order_in.priority,
        instructions=order_in.instructions,
        deadline=order_in.deadline,
        status="ASSIGNED"
    )
    db.add(work_order)
    db.flush()

    # Update issue status to ASSIGNED
    old_issue_status = issue.status
    issue.status = "ASSIGNED"
    issue.department_id = order_in.department_id
    issue.priority = order_in.priority

    db.add(IssueStatusHistory(
        issue_id=issue.id,
        from_status=old_issue_status,
        to_status="ASSIGNED",
        changed_by_id=current_user.id,
        comment=f"Assigned to {worker.name} ({worker.designation}) - Order {order_code}"
    ))

    # Update worker statistics
    worker.tasks_assigned += 1
    worker.tasks_pending += 1

    # Notify Citizen
    if issue.citizen_id:
        db.add(Notification(
            user_id=issue.citizen_id,
            title="Work Order Created",
            message=f"Work order {order_code} assigned for your issue {issue.ticket_code}.",
            type="WORK_ORDER",
            link=f"/citizen/report/{issue.id}"
        ))

    db.commit()
    db.refresh(work_order)

    log_audit(db, action="WORK_ORDER_CREATED", entity="WorkOrder", entity_id=str(work_order.id), user=current_user, new_value={"code": order_code, "worker": worker.name}, request=request)

    res = WorkOrderOut.model_validate(work_order)
    res.worker_name = worker.name
    res.department_name = department.name if department else "General"
    res.issue_ticket = issue.ticket_code
    res.issue_category = issue.category
    return res

@router.get("", response_model=List[WorkOrderOut])
def list_work_orders(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    department_id: Optional[int] = None,
    worker_id: Optional[int] = None,
    limit: int = Query(100, le=500),
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))
):
    query = db.query(WorkOrder)

    if status and status != "ALL":
        query = query.filter(WorkOrder.status == status)
    if priority and priority != "ALL":
        query = query.filter(WorkOrder.priority == priority)
    if department_id:
        query = query.filter(WorkOrder.department_id == department_id)
    if worker_id:
        query = query.filter(WorkOrder.worker_id == worker_id)

    orders = query.order_by(desc(WorkOrder.created_at)).offset(skip).limit(limit).all()

    result = []
    for order in orders:
        out = WorkOrderOut.model_validate(order)
        out.worker_name = order.assigned_worker.name if order.assigned_worker else "Unassigned"
        out.department_name = order.department.name if order.department else "General"
        out.issue_ticket = order.issue.ticket_code if order.issue else "N/A"
        out.issue_category = order.issue.category if order.issue else "N/A"
        result.append(out)

    return result

@router.get("/{id}", response_model=WorkOrderOut)
def get_work_order(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))):
    order = db.query(WorkOrder).filter(WorkOrder.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Work order not found")

    out = WorkOrderOut.model_validate(order)
    out.worker_name = order.assigned_worker.name if order.assigned_worker else "Unassigned"
    out.department_name = order.department.name if order.department else "General"
    out.issue_ticket = order.issue.ticket_code if order.issue else "N/A"
    out.issue_category = order.issue.category if order.issue else "N/A"
    return out

@router.put("/{id}/status", response_model=WorkOrderOut)
def update_work_order_status(
    id: int,
    status_in: WorkOrderStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))
):
    order = db.query(WorkOrder).filter(WorkOrder.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Work order not found")

    old_status = order.status
    order.status = status_in.status
    if status_in.manager_notes:
        order.manager_notes = status_in.manager_notes

    issue = order.issue
    now = datetime.now(timezone.utc)

    if status_in.status == "WORK_STARTED":
        order.started_at = now
        if issue:
            issue.status = "IN_PROGRESS"
            db.add(IssueStatusHistory(
                issue_id=issue.id,
                from_status="ASSIGNED",
                to_status="IN_PROGRESS",
                changed_by_id=current_user.id,
                comment=f"Work started by {order.assigned_worker.name if order.assigned_worker else 'crew'}"
            ))

    elif status_in.status == "WORK_COMPLETED":
        order.completed_at = now
        if issue:
            issue.status = "VERIFICATION"
            db.add(IssueStatusHistory(
                issue_id=issue.id,
                from_status="IN_PROGRESS",
                to_status="VERIFICATION",
                changed_by_id=current_user.id,
                comment="Field work completed, pending manager evidence verification"
            ))

    db.commit()
    db.refresh(order)

    log_audit(db, action=f"WORK_ORDER_{status_in.status}", entity="WorkOrder", entity_id=str(order.id), user=current_user, old_value={"status": old_status}, new_value={"status": status_in.status}, request=request)

    out = WorkOrderOut.model_validate(order)
    out.worker_name = order.assigned_worker.name if order.assigned_worker else "Unassigned"
    out.department_name = order.department.name if order.department else "General"
    out.issue_ticket = order.issue.ticket_code if order.issue else "N/A"
    out.issue_category = order.issue.category if order.issue else "N/A"
    return out

@router.post("/{id}/evidence")
async def upload_work_evidence(
    id: int,
    request: Request,
    description: Optional[str] = Form(None),
    before_image: Optional[UploadFile] = File(None),
    after_image: Optional[UploadFile] = File(None),
    before_image_url: Optional[str] = Form(None),
    after_image_url: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))
):
    """
    Manager uploads Before & After visual work evidence.
    """
    order = db.query(WorkOrder).filter(WorkOrder.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Work order not found")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    saved_before = before_image_url
    saved_after = after_image_url

    if before_image and before_image.filename:
        filename = f"before_{uuid.uuid4().hex[:8]}.jpg"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(await before_image.read())
        saved_before = f"/uploads/{filename}"

    if after_image and after_image.filename:
        filename = f"after_{uuid.uuid4().hex[:8]}.jpg"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(await after_image.read())
        saved_after = f"/uploads/{filename}"

    # Showcase fallback images if none uploaded
    if not saved_before:
        saved_before = order.issue.image_url if order.issue else "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800"
    if not saved_after:
        saved_after = "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=800"

    evidence = WorkEvidence(
        issue_id=order.issue_id,
        work_order_id=order.id,
        before_image_url=saved_before,
        after_image_url=saved_after,
        description=description or "Resurfacing and repair work verified.",
        uploaded_by_id=current_user.id,
        is_verified=True,
        verified_at=datetime.now(timezone.utc)
    )
    db.add(evidence)
    db.commit()

    log_audit(db, action="WORK_EVIDENCE_UPLOADED", entity="WorkEvidence", entity_id=str(evidence.id), user=current_user, request=request)

    return {"message": "Evidence uploaded successfully", "evidence_id": evidence.id, "before_url": saved_before, "after_url": saved_after}

@router.post("/{id}/verify")
def verify_work_order_completion(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))
):
    """
    Manager verifies completed work:
    - Marks work order as VERIFIED
    - Marks issue as RESOLVED / CLOSED
    - Increments worker completed tasks count
    - Notifies citizen to provide feedback
    """
    order = db.query(WorkOrder).filter(WorkOrder.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Work order not found")

    now = datetime.now(timezone.utc)
    order.status = "VERIFIED"
    order.verified_at = now

    worker = order.assigned_worker
    if worker:
        worker.tasks_completed += 1
        if worker.tasks_pending > 0:
            worker.tasks_pending -= 1

    issue = order.issue
    if issue:
        old_issue_status = issue.status
        issue.status = "RESOLVED"
        issue.resolved_at = now

        db.add(IssueStatusHistory(
            issue_id=issue.id,
            from_status=old_issue_status,
            to_status="RESOLVED",
            changed_by_id=current_user.id,
            comment=f"Manager {current_user.full_name} verified evidence and resolved issue."
        ))

        # Notify Citizen for Feedback
        if issue.citizen_id:
            db.add(Notification(
                user_id=issue.citizen_id,
                title="Issue Resolved! Please Rate Our Service",
                message=f"Your issue {issue.ticket_code} has been resolved by {worker.name if worker else 'our crew'}. Tap to review before/after evidence and leave feedback.",
                type="ISSUE",
                link=f"/citizen/report/{issue.id}"
            ))

    db.commit()

    log_audit(db, action="WORK_VERIFIED", entity="WorkOrder", entity_id=str(order.id), user=current_user, new_value={"status": "VERIFIED"}, request=request)

    return {"message": "Work order verified and issue successfully resolved", "order_id": order.id, "status": "VERIFIED"}
