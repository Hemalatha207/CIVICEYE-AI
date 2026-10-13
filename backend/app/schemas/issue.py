from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class IssueCreate(BaseModel):
    category: str
    description: str
    latitude: float
    longitude: float
    address: str
    ward: Optional[str] = "Ward 4"
    image_url: Optional[str] = None

class IssueUpdate(BaseModel):
    category: Optional[str] = None
    priority: Optional[str] = None
    department_id: Optional[int] = None
    manager_notes: Optional[str] = None
    status: Optional[str] = None

class IssueVerify(BaseModel):
    verified_category: str
    priority: str # LOW, MEDIUM, HIGH, CRITICAL
    department_id: int
    manager_notes: Optional[str] = None

class IssueReopen(BaseModel):
    reason: str

class IssueStatusHistoryOut(BaseModel):
    id: int
    from_status: Optional[str] = None
    to_status: str
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AIAnalysisOut(BaseModel):
    id: int
    model_name: str
    is_demo_mode: bool
    predicted_category: str
    confidence: float
    severity: str
    detected_objects: Optional[Any] = None
    inference_time_ms: float
    created_at: datetime

    class Config:
        from_attributes = True

class WorkEvidenceOut(BaseModel):
    id: int
    before_image_url: str
    after_image_url: str
    description: Optional[str] = None
    is_verified: bool
    verified_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class IssueOut(BaseModel):
    id: int
    ticket_code: str
    citizen_id: Optional[int] = None
    category: str
    verified_category: Optional[str] = None
    description: str
    image_url: Optional[str] = None
    latitude: float
    longitude: float
    address: str
    ward: Optional[str] = None
    ai_classification: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_severity: Optional[str] = None
    is_verified_by_manager: bool
    priority: str
    department_id: Optional[int] = None
    status: str
    is_duplicate: bool
    duplicate_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class IssueDetailOut(IssueOut):
    manager_notes: Optional[str] = None
    status_history: List[IssueStatusHistoryOut] = []
    ai_analyses: List[AIAnalysisOut] = []
    work_evidences: List[WorkEvidenceOut] = []
    possible_duplicates: List[IssueOut] = []

    class Config:
        from_attributes = True
