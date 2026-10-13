import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine
from app.api import (
    auth,
    issues,
    ai,
    workorders,
    staff,
    resignations,
    feedback,
    notifications,
    analytics,
    reports,
    audit,
    departments
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Auto-initialize database with demo accounts and data if missing
    from app.core.database import SessionLocal
    from app.models.user import User, Role
    from app.models.issue import Issue
    from app.seed_data import seed_database
    db = SessionLocal()
    try:
        if db.query(Role).count() == 0 or db.query(User).filter(User.email == "citizen@civiceye.local").first() is None or db.query(Issue).count() == 0:
            print("First run or missing demo data detected: Initializing Expo dataset...")
            seed_database(force_reset=False)
    except Exception as e:
        print(f"Notice during foundation check: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CIVICEYE AI — Intelligent Civic Issue Management & Smart City Command Center",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers with /api prefix
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(issues.router, prefix=api_prefix)
app.include_router(ai.router, prefix=api_prefix)
app.include_router(workorders.router, prefix=api_prefix)
app.include_router(staff.router, prefix=api_prefix)
app.include_router(resignations.router, prefix=api_prefix)
app.include_router(feedback.router, prefix=api_prefix)
app.include_router(notifications.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(audit.router, prefix=api_prefix)
app.include_router(departments.router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "tagline": "See the Problem. Understand It. Fix It.",
        "status": "ONLINE",
        "docs_url": "/docs"
    }

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=True)
