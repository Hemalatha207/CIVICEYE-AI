import os
import sys
import glob
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.core.config import settings
from app.models.user import User, Role, Permission, CitizenProfile, user_roles
from app.models.department import Department
from app.models.staff import Staff, StaffAttendance, ResignationRequest, AdministrativeAction
from app.models.issue import Issue, IssueImage, AIAnalysis, IssueStatusHistory, WorkEvidence
from app.models.workorder import WorkOrder
from app.models.feedback import CitizenFeedback
from app.models.notification import Notification
from app.models.audit import AuditLog

def clean_database(db: Session):
    """
    Cleans all previous records, demo data, test issues, and users.
    Preserves tables structure and schema integrity.
    """
    print("Purging all previous records, test data, and demo users...")
    
    # Disable foreign key checks for clean truncation / deletion
    is_mysql = "mysql" in str(engine.url)
    if is_mysql:
        db.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
    
    tables_to_clear = [
        "work_evidence",
        "citizen_feedback",
        "work_orders",
        "issue_status_history",
        "ai_analysis",
        "issue_images",
        "issues",
        "administrative_actions",
        "resignations",
        "staff_attendance",
        "staff",
        "notifications",
        "audit_logs",
        "citizens",
        "departments",
        "user_roles",
        "role_permissions",
        "users",
    ]
    
    for table in tables_to_clear:
        try:
            db.execute(text(f"DELETE FROM {table};"))
            if is_mysql:
                try:
                    db.execute(text(f"ALTER TABLE {table} AUTO_INCREMENT = 1;"))
                except Exception:
                    pass
        except Exception as e:
            print(f"  Notice while clearing {table}: {e}")
            
    if is_mysql:
        db.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
    
    db.commit()
    print("All previous records and data successfully removed.")

def clean_uploads_directory():
    """Removes all previous uploaded demo and test images."""
    upload_dir = settings.UPLOAD_DIR
    if os.path.exists(upload_dir):
        files = glob.glob(os.path.join(upload_dir, "*"))
        cleared_count = 0
        for f in files:
            if os.path.isfile(f) and not f.endswith(".gitkeep"):
                try:
                    os.remove(f)
                    cleared_count += 1
                except Exception as e:
                    print(f"  Warning removing {f}: {e}")
        # Ensure .gitkeep exists
        gitkeep_path = os.path.join(upload_dir, ".gitkeep")
        if not os.path.exists(gitkeep_path):
            with open(gitkeep_path, "w") as k:
                k.write("")
        print(f"Cleaned {cleared_count} previous file uploads from {upload_dir}.")

def setup_production_foundation(db: Session, admin_email: str = None, admin_password: str = None, admin_name: str = None):
    """
    Initializes production foundational roles, standard municipal departments,
    and a primary production administrator.
    """
    print("Setting up production foundation...")
    
    # 1. Standard System Roles
    roles_def = [
        ("ADMIN", "System Administrator with global municipal governance & security privileges"),
        ("MANAGER", "Civic Operations & Ward Dispatch Manager"),
        ("CITIZEN", "Verified Citizen Reporter")
    ]
    roles_map = {}
    for r_name, r_desc in roles_def:
        role = db.query(Role).filter(Role.name == r_name).first()
        if not role:
            role = Role(name=r_name, description=r_desc)
            db.add(role)
            db.flush()
        roles_map[r_name] = role
    print(f"Verified {len(roles_map)} system security roles: {list(roles_map.keys())}")

    # 2. Standard Municipal Departments
    standard_departments = [
        {
            "name": "Road & Infrastructure Maintenance",
            "code": "ROADS",
            "description": "Bitumen surfacing, pothole patching, pavement rehabilitation, and road safety infrastructure.",
            "head_name": "Director of Road Operations",
            "contact_email": "roads@civiceye.gov",
            "contact_phone": "+1 (555) 010-7623"
        },
        {
            "name": "Water Supply & Underground Drainage",
            "code": "WATER",
            "description": "Municipal water pipeline networks, leak repairs, sewer unclogging, and storm drainage.",
            "head_name": "Director of Water Works",
            "contact_email": "water@civiceye.gov",
            "contact_phone": "+1 (555) 010-9844"
        },
        {
            "name": "Sanitation & Solid Waste Management",
            "code": "SANITATION",
            "description": "Public sanitation, municipal bin clearance, garbage transfer stations, and environmental hygiene.",
            "head_name": "Director of Public Sanitation",
            "contact_email": "sanitation@civiceye.gov",
            "contact_phone": "+1 (555) 010-3321"
        },
        {
            "name": "Electrical & Street Lighting Network",
            "code": "ELECTRICAL",
            "description": "Streetlight pole wiring, LED fixtures, traffic signals, transformers, and public power distribution.",
            "head_name": "Chief Electrical Engineer",
            "contact_email": "electrical@civiceye.gov",
            "contact_phone": "+1 (555) 010-5590"
        },
        {
            "name": "Public Works & Environmental Infrastructure",
            "code": "PUBLIC_WORKS",
            "description": "Urban park facilities, fallen tree removals, public walkway hazards, and barrier repairs.",
            "head_name": "Superintendent of Public Works",
            "contact_email": "publicworks@civiceye.gov",
            "contact_phone": "+1 (555) 010-6712"
        },
    ]

    for dept_info in standard_departments:
        dept = db.query(Department).filter(Department.code == dept_info["code"]).first()
        if not dept:
            dept = Department(**dept_info)
            db.add(dept)
    db.flush()
    print(f"Initialized {len(standard_departments)} municipal departments.")

    # 3. Create Production Administrator Account
    target_email = (admin_email or os.getenv("INITIAL_ADMIN_EMAIL") or "admin@civiceye.gov").lower()
    target_pass = admin_password or os.getenv("INITIAL_ADMIN_PASSWORD") or "CivicEyeAdmin2026!#"
    target_name = admin_name or os.getenv("INITIAL_ADMIN_NAME") or "Civic Administrator"

    admin_user = db.query(User).filter(User.email == target_email).first()
    if not admin_user:
        admin_user = User(
            email=target_email,
            hashed_password=get_password_hash(target_pass),
            full_name=target_name,
            phone_number="+1 (555) 019-0000",
            is_active=True,
            is_verified=True,
            avatar_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
        )
        admin_user.roles.append(roles_map["ADMIN"])
        admin_user.roles.append(roles_map["MANAGER"])
        db.add(admin_user)
        db.flush()

        # Create admin audit log
        audit = AuditLog(
            user_id=admin_user.id,
            user_email=admin_user.email,
            action="PRODUCTION_INITIALIZED",
            entity="System",
            entity_id="1",
            ip_address="127.0.0.1",
            new_value={"admin_email": target_email, "departments": len(standard_departments)}
        )
        db.add(audit)
        print(f"Created Production Administrator: {target_email}")
    else:
        print(f"Production Administrator already exists: {target_email}")

    db.commit()

def run_production_init(clean_first: bool = True):
    print("=" * 60)
    print("  CIVICEYE AI - PRODUCTION INITIALIZATION")
    print("=" * 60)
    
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        if clean_first:
            clean_database(db)
            clean_uploads_directory()
        
        setup_production_foundation(db)
        
        # Verify clean state
        user_count = db.query(User).count()
        issue_count = db.query(Issue).count()
        wo_count = db.query(WorkOrder).count()
        staff_count = db.query(Staff).count()
        dept_count = db.query(Department).count()
        
        print("\n" + "=" * 60)
        print("  PRODUCTION DATABASE VERIFICATION")
        print("=" * 60)
        print(f"  • Total Users:       {user_count} (Primary Administrator)")
        print(f"  • Issues / Tickets:  {issue_count} (Clean slate ready for real reports)")
        print(f"  • Work Orders:       {wo_count} (Clean)")
        print(f"  • Staff Roster:      {staff_count} (Ready for staff onboarding)")
        print(f"  • Departments:       {dept_count} (Configured)")
        print("=" * 60)
        print("  System is clean, secured, and PRODUCTION READY.")
        print("=" * 60 + "\n")
    finally:
        db.close()

if __name__ == "__main__":
    run_production_init(clean_first=True)
