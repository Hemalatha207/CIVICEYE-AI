from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class WorkOrderCreate(BaseModel):
    issue_id: int
    department_id: int
    worker_id: int
    priority: str = "MEDIUM"
    instructions: str
    deadline: Optional[date] = None

class WorkOrderStatusUpdate(BaseModel):
    status: str # ASSIGNED, WORK_STARTED, WORK_COMPLETED, VERIFICATION, VERIFIED, REOPENED, CANCELLED
    manager_notes: Optional[str] = None

class WorkEvidenceCreate(BaseModel):
    issue_id: int
    work_order_id: Optional[int] = None
    before_image_url: str
    after_image_url: str
    description: Optional[str] = None

class WorkOrderOut(BaseModel):
    id: int
    order_code: str
    issue_id: int
    department_id: int
    worker_id: int
    manager_id: Optional[int] = None
    priority: str
    instructions: str
    deadline: Optional[date] = None
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    manager_notes: Optional[str] = None
    created_at: datetime
    
    # Associated details
    worker_name: Optional[str] = None
    department_name: Optional[str] = None
    issue_ticket: Optional[str] = None
    issue_category: Optional[str] = None

    class Config:
        from_attributes = True
