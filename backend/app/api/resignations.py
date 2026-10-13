from datetime import datetime, timezone, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.deps import get_current_user, require_role, log_audit
from app.models.user import User
from app.models.staff import Staff, ResignationRequest
from app.schemas.staff import ResignationCreate, ResignationReview, ResignationOut

router = APIRouter(prefix="/resignations", tags=["Resignations"])

@router.post("/staff/{staff_id}", response_model=ResignationOut)
def submit_resignation(
    staff_id: int,
    res_in: ResignationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))
):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    new_resignation = ResignationRequest(
        staff_id=staff_id,
        request_date=date.today(),
        requested_last_date=res_in.requested_last_date,
        reason=res_in.reason,
        comments=res_in.comments,
        supporting_document_url=res_in.supporting_document_url,
        status="SUBMITTED"
    )
    db.add(new_resignation)
    db.commit()
    db.refresh(new_resignation)

    log_audit(db, action="RESIGNATION_SUBMITTED", entity="ResignationRequest", entity_id=str(new_resignation.id), user=current_user, new_value={"staff": staff.name, "last_date": str(res_in.requested_last_date)}, request=request)

    out = ResignationOut.model_validate(new_resignation)
    out.staff_name = staff.name
    return out

@router.get("", response_model=List[ResignationOut])
def list_resignations(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))
):
    query = db.query(ResignationRequest)
    if status and status != "ALL":
        query = query.filter(ResignationRequest.status == status)

    records = query.order_by(desc(ResignationRequest.created_at)).all()
    results = []
    for r in records:
        out = ResignationOut.model_validate(r)
        out.staff_name = r.staff.name if r.staff else "N/A"
        results.append(out)
    return results

@router.put("/{id}/review", response_model=ResignationOut)
def review_resignation(
    id: int,
    review_in: ResignationReview,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["MANAGER", "ADMIN"]))
):
    res_req = db.query(ResignationRequest).filter(ResignationRequest.id == id).first()
    if not res_req:
        raise HTTPException(status_code=404, detail="Resignation request not found")

    old_status = res_req.status
    res_req.status = review_in.status
    res_req.review_comments = review_in.review_comments
    res_req.reviewed_by = current_user.id
    res_req.resolved_at = datetime.now(timezone.utc)

    if review_in.status == "APPROVED":
        res_req.staff.employment_status = "RESIGNED"

    db.commit()
    db.refresh(res_req)

    log_audit(db, action="RESIGNATION_REVIEWED", entity="ResignationRequest", entity_id=str(res_req.id), user=current_user, old_value={"status": old_status}, new_value={"status": review_in.status}, request=request)

    out = ResignationOut.model_validate(res_req)
    out.staff_name = res_req.staff.name if res_req.staff else "N/A"
    return out
