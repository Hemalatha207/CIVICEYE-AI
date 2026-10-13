from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class WorkOrder(Base):
    __tablename__ = 'work_orders'

    id = Column(Integer, primary_key=True, index=True)
    order_code = Column(String(50), unique=True, nullable=False, index=True) # e.g. WO-4021
    issue_id = Column(Integer, ForeignKey('issues.id', ondelete='CASCADE'), nullable=False)
    department_id = Column(Integer, ForeignKey('departments.id', ondelete='RESTRICT'), nullable=False)
    worker_id = Column(Integer, ForeignKey('staff.id', ondelete='RESTRICT'), nullable=False)
    manager_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    
    priority = Column(String(50), default="MEDIUM", index=True)
    instructions = Column(Text, nullable=False)
    deadline = Column(Date, nullable=True)
    
    # Statuses: ASSIGNED, WORK_STARTED, WORK_COMPLETED, VERIFICATION, VERIFIED, REOPENED, CANCELLED
    status = Column(String(50), default="ASSIGNED", index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    manager_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    issue = relationship("Issue", back_populates="work_orders")
    department = relationship("Department", back_populates="work_orders")
    assigned_worker = relationship("Staff", back_populates="work_orders")
    manager = relationship("User", foreign_keys=[manager_id])
