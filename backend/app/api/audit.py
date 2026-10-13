from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.deps import require_role
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.feedback import AuditLogOut

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogOut])
def get_audit_logs(
    action: Optional[str] = None,
    entity: Optional[str] = None,
    limit: int = Query(100, le=500),
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "MANAGER"]))
):
    query = db.query(AuditLog)
    if action and action != "ALL":
        query = query.filter(AuditLog.action == action)
    if entity and entity != "ALL":
        query = query.filter(AuditLog.entity == entity)

    return query.order_by(desc(AuditLog.timestamp)).offset(skip).limit(limit).all()
