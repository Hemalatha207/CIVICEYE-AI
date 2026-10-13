from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.issue import Issue
from app.models.workorder import WorkOrder
from app.models.staff import Staff
from app.models.department import Department
from app.models.feedback import CitizenFeedback
from app.schemas.analytics import AnalyticsDashboard, KPICards, CategoryData, TrendData, PriorityData, DepartmentWorkload, CitizenSatisfaction

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=AnalyticsDashboard)
def get_dashboard_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Total counts
    total_issues = db.query(Issue).count()
    pending = db.query(Issue).filter(Issue.status.in_(["REPORTED", "PENDING_REVIEW", "VERIFIED"])).count()
    in_progress = db.query(Issue).filter(Issue.status.in_(["ASSIGNED", "IN_PROGRESS", "VERIFICATION"])).count()
    resolved = db.query(Issue).filter(Issue.status.in_(["RESOLVED", "CLOSED", "COMPLETED"])).count()
    high_priority = db.query(Issue).filter(Issue.priority.in_(["HIGH", "CRITICAL"]), Issue.status != "RESOLVED", Issue.status != "CLOSED").count()
    reopened = db.query(Issue).filter(Issue.status == "REOPENED").count()

    resolution_rate = round((resolved / total_issues * 100), 1) if total_issues > 0 else 0.0

    kpis = KPICards(
        total_issues=total_issues,
        pending=pending,
        in_progress=in_progress,
        resolved=resolved,
        high_priority=high_priority,
        reopened=reopened,
        resolution_rate_percent=resolution_rate
    )

    # Categories breakdown
    categories_query = db.query(
        Issue.category,
        func.count(Issue.id).label("count"),
        func.sum(case((Issue.status.in_(["RESOLVED", "CLOSED", "COMPLETED"]), 1), else_=0)).label("resolved")
    ).group_by(Issue.category).all()

    categories_data = [
        CategoryData(category=row[0], count=row[1], resolved=int(row[2] or 0))
        for row in categories_query
    ]

    # Priorities breakdown
    priority_query = db.query(
        Issue.priority,
        func.count(Issue.id).label("count")
    ).group_by(Issue.priority).all()

    priorities_data = [
        PriorityData(priority=row[0], count=row[1])
        for row in priority_query
    ]

    # Department Workload
    departments = db.query(Department).all()
    dept_workloads = []
    for d in departments:
        assigned = db.query(WorkOrder).filter(WorkOrder.department_id == d.id).count()
        completed = db.query(WorkOrder).filter(WorkOrder.department_id == d.id, WorkOrder.status.in_(["WORK_COMPLETED", "VERIFIED"])).count()
        dept_workloads.append(DepartmentWorkload(
            department=d.name,
            assigned=assigned,
            completed=completed,
            pending=max(0, assigned - completed)
        ))

    # Trends (Last 7 days)
    trends_data = []
    today = datetime.now(timezone.utc).date()
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%b %d")
        
        rep = db.query(Issue).filter(func.date(Issue.created_at) == day).count()
        res = db.query(Issue).filter(func.date(Issue.resolved_at) == day).count()
        trends_data.append(TrendData(date=day_str, reported=rep, resolved=res))

    # Citizen Satisfaction
    feedbacks = db.query(CitizenFeedback).all()
    total_rev = len(feedbacks)
    avg_rating = round(sum(f.rating for f in feedbacks) / total_rev, 2) if total_rev > 0 else 0.0
    five_star = sum(1 for f in feedbacks if f.rating == 5)
    four_star = sum(1 for f in feedbacks if f.rating == 4)
    three_star = sum(1 for f in feedbacks if f.rating == 3)
    two_star = sum(1 for f in feedbacks if f.rating == 2)
    one_star = sum(1 for f in feedbacks if f.rating == 1)

    satisfaction = CitizenSatisfaction(
        average_rating=avg_rating,
        total_reviews=total_rev,
        five_star=five_star,
        four_star=four_star,
        three_star=three_star,
        two_star=two_star,
        one_star=one_star
    )

    return AnalyticsDashboard(
        kpis=kpis,
        categories=categories_data,
        trends=trends_data,
        priorities=priorities_data,
        departments=dept_workloads,
        satisfaction=satisfaction
    )
