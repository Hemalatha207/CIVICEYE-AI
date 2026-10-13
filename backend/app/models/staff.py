from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Staff(Base):
    __tablename__ = 'staff'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    department_id = Column(Integer, ForeignKey('departments.id', ondelete='RESTRICT'), nullable=False)
    
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    designation = Column(String(100), nullable=False) # Field Worker, Senior Technician, Inspector, Maintenance Lead
    
    # ACTIVE, ON_LEAVE, SUSPENDED, RESIGNED, TERMINATED, RETIRED, INACTIVE
    employment_status = Column(String(50), default="ACTIVE", index=True)
    joining_date = Column(Date, default=date.today)
    
    tasks_assigned = Column(Integer, default=0)
    tasks_completed = Column(Integer, default=0)
    tasks_pending = Column(Integer, default=0)
    avg_completion_hours = Column(Float, default=4.5)
    attendance_rate = Column(Float, default=95.0)
    citizen_rating = Column(Float, default=4.8)
    
    avatar_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="staff_profile")
    department = relationship("Department", back_populates="staff_members")
    work_orders = relationship("WorkOrder", back_populates="assigned_worker")
    resignations = relationship("ResignationRequest", back_populates="staff")
    admin_actions = relationship("AdministrativeAction", back_populates="staff")

class StaffAttendance(Base):
    __tablename__ = 'staff_attendance'

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    attendance_date = Column(Date, default=date.today)
    status = Column(String(20), default="PRESENT") # PRESENT, ABSENT, ON_LEAVE, HALF_DAY
    shift = Column(String(20), default="MORNING")
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)

class ResignationRequest(Base):
    __tablename__ = 'resignations'

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    request_date = Column(Date, default=date.today)
    requested_last_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    comments = Column(Text, nullable=True)
    supporting_document_url = Column(String(500), nullable=True)
    
    # SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, WITHDRAWN, COMPLETED
    status = Column(String(50), default="SUBMITTED", index=True)
    reviewed_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    review_comments = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    staff = relationship("Staff", back_populates="resignations")

class AdministrativeAction(Base):
    __tablename__ = 'administrative_actions'

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    action_type = Column(String(100), nullable=False) # WARNING, SUSPENSION, PROMOTION, SALARY_REVIEW, INQUIRY, DISMISSAL
    reason = Column(Text, nullable=False)
    evidence_url = Column(String(500), nullable=True)
    created_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    reviewer_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    is_approved = Column(Boolean, default=False)
    final_status = Column(String(50), default="PENDING")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    staff = relationship("Staff", back_populates="admin_actions")
