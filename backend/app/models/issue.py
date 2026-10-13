from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Issue(Base):
    __tablename__ = 'issues'

    id = Column(Integer, primary_key=True, index=True)
    ticket_code = Column(String(50), unique=True, nullable=False, index=True) # e.g. CV-1042
    citizen_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    
    # Categories: Pothole, Garbage, Streetlight Damage, Water Leakage, Road Damage, Drainage Issue, Fallen Tree, Other
    category = Column(String(100), nullable=False, index=True)
    verified_category = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    
    # Location
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(500), nullable=False)
    ward = Column(String(100), nullable=True, default="Ward 4")
    city = Column(String(100), default="Metropolis")
    
    # AI Classification (stored separately from manager verified classification)
    ai_classification = Column(String(100), nullable=True)
    ai_confidence = Column(Float, nullable=True) # 0.0 to 1.0
    ai_severity = Column(String(50), nullable=True) # LOW, MEDIUM, HIGH, CRITICAL
    ai_raw_data = Column(JSON, nullable=True)
    
    # Manager Verification & Triage
    is_verified_by_manager = Column(Boolean, default=False)
    verified_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    manager_notes = Column(Text, nullable=True)
    priority = Column(String(50), default="MEDIUM", index=True) # LOW, MEDIUM, HIGH, CRITICAL
    department_id = Column(Integer, ForeignKey('departments.id', ondelete='SET NULL'), nullable=True)
    
    # Status:
    # REPORTED, AI_ANALYZED, PENDING_REVIEW, VERIFIED, ASSIGNED, IN_PROGRESS,
    # COMPLETED, VERIFICATION, CLOSED, REJECTED, DUPLICATE, REOPENED
    status = Column(String(50), default="REPORTED", index=True)
    
    # Duplicate detection
    is_duplicate = Column(Boolean, default=False)
    duplicate_of_id = Column(Integer, ForeignKey('issues.id', ondelete='SET NULL'), nullable=True)
    duplicate_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    citizen = relationship("User", foreign_keys=[citizen_id], back_populates="reported_issues")
    verified_by = relationship("User", foreign_keys=[verified_by_id])
    department = relationship("Department", back_populates="issues")
    images = relationship("IssueImage", back_populates="issue", cascade="all, delete-orphan")
    ai_analyses = relationship("AIAnalysis", back_populates="issue", cascade="all, delete-orphan")
    status_history = relationship("IssueStatusHistory", back_populates="issue", cascade="all, delete-orphan", order_by="IssueStatusHistory.created_at")
    work_orders = relationship("WorkOrder", back_populates="issue")
    work_evidences = relationship("WorkEvidence", back_populates="issue", cascade="all, delete-orphan")
    feedback = relationship("CitizenFeedback", back_populates="issue", uselist=False)

class IssueImage(Base):
    __tablename__ = 'issue_images'

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey('issues.id', ondelete='CASCADE'), nullable=False)
    image_url = Column(String(500), nullable=False)
    image_type = Column(String(50), default="CITIZEN_REPORT") # CITIZEN_REPORT, INSPECTION, ATTACHMENT
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    issue = relationship("Issue", back_populates="images")

class AIAnalysis(Base):
    __tablename__ = 'ai_analysis'

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey('issues.id', ondelete='CASCADE'), nullable=False)
    model_name = Column(String(100), default="YOLOv8-CivicVision-v2.1")
    is_demo_mode = Column(Boolean, default=False)
    predicted_category = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    severity = Column(String(50), nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    detected_objects = Column(JSON, nullable=True)
    inference_time_ms = Column(Float, default=45.2)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    issue = relationship("Issue", back_populates="ai_analyses")

class IssueStatusHistory(Base):
    __tablename__ = 'issue_status_history'

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey('issues.id', ondelete='CASCADE'), nullable=False)
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    changed_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    issue = relationship("Issue", back_populates="status_history")
    changed_by = relationship("User")

class WorkEvidence(Base):
    __tablename__ = 'work_evidence'

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey('issues.id', ondelete='CASCADE'), nullable=False)
    work_order_id = Column(Integer, ForeignKey('work_orders.id', ondelete='CASCADE'), nullable=True)
    before_image_url = Column(String(500), nullable=False)
    after_image_url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    uploaded_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    issue = relationship("Issue", back_populates="work_evidences")
