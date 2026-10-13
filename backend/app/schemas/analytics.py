from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class KPICards(BaseModel):
    total_issues: int
    pending: int
    in_progress: int
    resolved: int
    high_priority: int
    reopened: int
    resolution_rate_percent: float

class CategoryData(BaseModel):
    category: str
    count: int
    resolved: int

class TrendData(BaseModel):
    date: str
    reported: int
    resolved: int

class PriorityData(BaseModel):
    priority: str
    count: int

class DepartmentWorkload(BaseModel):
    department: str
    assigned: int
    completed: int
    pending: int

class CitizenSatisfaction(BaseModel):
    average_rating: float
    total_reviews: int
    five_star: int
    four_star: int
    three_star: int
    two_star: int
    one_star: int

class AnalyticsDashboard(BaseModel):
    kpis: KPICards
    categories: List[CategoryData]
    trends: List[TrendData]
    priorities: List[PriorityData]
    departments: List[DepartmentWorkload]
    satisfaction: CitizenSatisfaction
