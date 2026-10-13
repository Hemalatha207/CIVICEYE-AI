from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class CitizenFeedback(Base):
    __tablename__ = 'citizen_feedback'

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey('issues.id', ondelete='CASCADE'), unique=True, nullable=False)
    citizen_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    
    # YES, PARTIALLY, NO
    resolved_status = Column(String(50), nullable=False)
    rating = Column(Integer, nullable=False) # 1 to 5
    comment = Column(Text, nullable=True)
    feedback_image_url = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    issue = relationship("Issue", back_populates="feedback")
    citizen = relationship("User")
