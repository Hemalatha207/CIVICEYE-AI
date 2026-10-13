from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FeedbackCreate(BaseModel):
    issue_id: int
    resolved_status: str # YES, PARTIALLY, NO
    rating: int # 1 to 5
    comment: Optional[str] = None
    feedback_image_url: Optional[str] = None

class FeedbackOut(BaseModel):
    id: int
    issue_id: int
    ticket_code: Optional[str] = None
    resolved_status: str
    rating: int
    comment: Optional[str] = None
    feedback_image_url: Optional[str] = None
    created_at: datetime
    citizen_name: Optional[str] = None

    class Config:
        from_attributes = True

class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    action: str
    entity: str
    entity_id: Optional[str] = None
    old_value: Optional[dict] = None
    new_value: Optional[dict] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
