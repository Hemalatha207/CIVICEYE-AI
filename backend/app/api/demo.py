from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings

router = APIRouter(prefix="/demo", tags=["Demo"])

@router.post("/reset")
def reset_expo_demo(db: Session = Depends(get_db)):
    """
    Disabled in production.
    """
    if getattr(settings, "ENVIRONMENT", "production") == "production":
        raise HTTPException(
            status_code=403,
            detail="Demo database reset is permanently disabled in production mode."
        )
    return {"message": "Demo mode is disabled in production", "status": "disabled"}
