from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.deps import get_current_user, log_audit
from app.models.user import User
from app.models.issue import Issue, IssueStatusHistory
from app.models.feedback import CitizenFeedback
from app.models.notification import Notification
from app.schemas.feedback import FeedbackCreate, FeedbackOut

router = APIRouter(prefix="/feedback", tags=["Citizen Feedback"])

@router.post("", response_model=FeedbackOut)
def submit_feedback(
    fb_in: FeedbackCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == fb_in.issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    existing = db.query(CitizenFeedback).filter(CitizenFeedback.issue_id == fb_in.issue_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Feedback already submitted for this issue")

    feedback = CitizenFeedback(
        issue_id=fb_in.issue_id,
        citizen_id=current_user.id,
        resolved_status=fb_in.resolved_status,
        rating=fb_in.rating,
        comment=fb_in.comment,
        feedback_image_url=fb_in.feedback_image_url
    )
    db.add(feedback)

    # If citizen marks "NO", auto-reopen issue and flag for manager review
    if fb_in.resolved_status.upper() == "NO":
        old_status = issue.status
        issue.status = "REOPENED"
        db.add(IssueStatusHistory(
            issue_id=issue.id,
            from_status=old_status,
            to_status="REOPENED",
            changed_by_id=current_user.id,
            comment=f"Auto-reopened following citizen feedback: Rating {fb_in.rating}/5. Comment: {fb_in.comment or 'Unresolved'}"
        ))

        # Notify managers
        managers = db.query(User).filter(User.roles.any(name="MANAGER")).all()
        for mgr in managers:
            db.add(Notification(
                user_id=mgr.id,
                title="Negative Citizen Feedback - Issue Reopened",
                message=f"Issue {issue.ticket_code} was marked NOT resolved by citizen. Reopened for corrective action.",
                type="ALERT",
                link=f"/manager/issues/{issue.id}"
            ))

    db.commit()
    db.refresh(feedback)

    log_audit(db, action="FEEDBACK_CREATED", entity="CitizenFeedback", entity_id=str(feedback.id), user=current_user, new_value={"rating": fb_in.rating, "resolved": fb_in.resolved_status}, request=request)

    out = FeedbackOut.model_validate(feedback)
    out.ticket_code = issue.ticket_code
    out.citizen_name = current_user.full_name
    return out

@router.get("", response_model=List[FeedbackOut])
def list_feedback(
    issue_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(CitizenFeedback)
    if issue_id:
        query = query.filter(CitizenFeedback.issue_id == issue_id)

    feedbacks = query.order_by(desc(CitizenFeedback.created_at)).limit(limit).all()
    results = []
    for f in feedbacks:
        out = FeedbackOut.model_validate(f)
        out.ticket_code = f.issue.ticket_code if f.issue else "N/A"
        out.citizen_name = f.citizen.full_name if f.citizen else "Citizen"
        results.append(out)
    return results
