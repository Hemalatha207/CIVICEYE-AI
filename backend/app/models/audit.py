from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = 'audit_logs'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False, index=True) 
    # LOGIN, LOGOUT, ISSUE_CREATED, ISSUE_UPDATED, AI_ANALYSIS, ISSUE_VERIFIED, 
    # PRIORITY_CHANGED, WORK_ORDER_CREATED, WORKER_ASSIGNED, WORK_STARTED, 
    # WORK_COMPLETED, WORK_VERIFIED, FEEDBACK_CREATED, STAFF_CREATED, STAFF_UPDATED,
    # RESIGNATION_SUBMITTED, RESIGNATION_APPROVED, ADMINISTRATIVE_ACTION, ROLE_CHANGED
    
    entity = Column(String(100), nullable=False) # Issue, WorkOrder, Staff, User, Feedback, Resignation
    entity_id = Column(String(100), nullable=True)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    ip_address = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User")
