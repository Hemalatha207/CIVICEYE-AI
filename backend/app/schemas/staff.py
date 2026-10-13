from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

class StaffCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department_id: int
    designation: str
    employment_status: Optional[str] = "ACTIVE"
    avatar_url: Optional[str] = None
    notes: Optional[str] = None

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    employment_status: Optional[str] = None
    notes: Optional[str] = None

class StaffOut(BaseModel):
    id: int
    employee_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department_id: int
    department_name: Optional[str] = None
    designation: str
    employment_status: str
    joining_date: date
    tasks_assigned: int
    tasks_completed: int
    tasks_pending: int
    avg_completion_hours: float
    attendance_rate: float
    citizen_rating: float
    avatar_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ResignationCreate(BaseModel):
    requested_last_date: date
    reason: str
    comments: Optional[str] = None
    supporting_document_url: Optional[str] = None

class ResignationReview(BaseModel):
    status: str # APPROVED, REJECTED, UNDER_REVIEW
    review_comments: Optional[str] = None

class ResignationOut(BaseModel):
    id: int
    staff_id: int
    staff_name: Optional[str] = None
    request_date: date
    requested_last_date: date
    reason: str
    comments: Optional[str] = None
    status: str
    reviewed_by: Optional[int] = None
    review_comments: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AdminActionCreate(BaseModel):
    staff_id: int
    action_type: str # WARNING, SUSPENSION, PROMOTION, SALARY_REVIEW, INQUIRY, DISMISSAL
    reason: str
    evidence_url: Optional[str] = None

class AdminActionOut(BaseModel):
    id: int
    staff_id: int
    staff_name: Optional[str] = None
    action_type: str
    reason: str
    evidence_url: Optional[str] = None
    is_approved: bool
    final_status: str
    timestamp: datetime

    class Config:
        from_attributes = True
