from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import require_role
from app.models.department import Department
from pydantic import BaseModel

router = APIRouter(prefix="/departments", tags=["Departments"])

class DepartmentCreate(BaseModel):
    name: str
    code: str
    description: str | None = None
    head_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None

class DepartmentOut(BaseModel):
    id: int
    name: str
    code: str
    description: str | None = None
    head_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None

    class Config:
        from_attributes = True

@router.get("", response_model=List[DepartmentOut])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@router.post("", response_model=DepartmentOut)
def create_department(
    dept_in: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["ADMIN"]))
):
    existing = db.query(Department).filter(
        (Department.name == dept_in.name) | (Department.code == dept_in.code.upper())
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name or code already exists")

    new_dept = Department(
        name=dept_in.name,
        code=dept_in.code.upper(),
        description=dept_in.description,
        head_name=dept_in.head_name,
        contact_email=dept_in.contact_email,
        contact_phone=dept_in.contact_phone
    )
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept
