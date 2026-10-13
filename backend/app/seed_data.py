import random
from datetime import datetime, timedelta, timezone, date
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User, Role, Permission, CitizenProfile
from app.models.department import Department
from app.models.staff import Staff, StaffAttendance, ResignationRequest, AdministrativeAction
from app.models.issue import Issue, IssueImage, AIAnalysis, IssueStatusHistory, WorkEvidence
from app.models.workorder import WorkOrder
from app.models.feedback import CitizenFeedback
from app.models.notification import Notification
from app.models.audit import AuditLog

DEMO_PASSWORD = "password123"

def seed_database(force_reset: bool = False):
    db: Session = SessionLocal()
    try:
        # Ensure all tables are created
        Base.metadata.create_all(bind=engine)

        if force_reset:
            print("Force resetting database tables...")
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)

        # Check if already seeded
        existing_issues = db.query(Issue).count()
        if existing_issues >= 200 and not force_reset:
            print("Database already populated with realistic demo dataset.")
            return

        print("Seeding CivicEye AI Science Expo Database...")

        # 1. Create Roles
        roles_data = [
            ("ADMIN", "System Administrator with global privileges"),
            ("MANAGER", "Civic Operations & Ward Dispatch Manager"),
            ("CITIZEN", "Registered Citizen Reporter")
        ]
        roles = {}
        for r_name, r_desc in roles_data:
            role = db.query(Role).filter(Role.name == r_name).first()
            if not role:
                role = Role(name=r_name, description=r_desc)
                db.add(role)
                db.flush()
            roles[r_name] = role

        # 2. Create Standard Demo Users
        admin_user = db.query(User).filter(User.email == "admin@civiceye.local").first()
        if not admin_user:
            admin_user = User(
                email="admin@civiceye.local",
                hashed_password=get_password_hash(DEMO_PASSWORD),
                full_name="Chief Executive Officer",
                phone_number="+1 (555) 019-2831",
                is_active=True,
                is_verified=True,
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            )
            admin_user.roles.append(roles["ADMIN"])
            db.add(admin_user)

        manager_user = db.query(User).filter(User.email == "manager@civiceye.local").first()
        if not manager_user:
            manager_user = User(
                email="manager@civiceye.local",
                hashed_password=get_password_hash(DEMO_PASSWORD),
                full_name="David Sterling",
                phone_number="+1 (555) 014-8892",
                is_active=True,
                is_verified=True,
                avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
            )
            manager_user.roles.append(roles["MANAGER"])
            db.add(manager_user)

        citizen_user = db.query(User).filter(User.email == "citizen@civiceye.local").first()
        if not citizen_user:
            citizen_user = User(
                email="citizen@civiceye.local",
                hashed_password=get_password_hash(DEMO_PASSWORD),
                full_name="Sarah Jenkins",
                phone_number="+1 (555) 017-4321",
                is_active=True,
                is_verified=True,
                avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
            )
            citizen_user.roles.append(roles["CITIZEN"])
            db.add(citizen_user)
            db.flush()

            citizen_profile = CitizenProfile(
                user_id=citizen_user.id,
                address="742 Evergreen Terrace, Ward 4",
                ward="Ward 4",
                reputation_score=150
            )
            db.add(citizen_profile)

        # 3. Create Departments
        depts_data = [
            {"name": "Road Maintenance", "code": "ROAD", "head": "Eng. Robert Vance", "email": "roads@metropolis.gov", "desc": "Potholes, asphalt paving, and structural road fixes"},
            {"name": "Water Supply", "code": "WATER", "head": "Elena Rostova", "email": "water@metropolis.gov", "desc": "Mains leakage, pipeline pressure, and public hydrants"},
            {"name": "Sanitation", "code": "SANI", "head": "Marcus Brody", "email": "sanitation@metropolis.gov", "desc": "Waste disposal, street clearing, and fallen debris"},
            {"name": "Electrical", "code": "ELEC", "head": "Anand Patel", "email": "electrical@metropolis.gov", "desc": "Street illumination, power poles, and smart traffic grids"},
            {"name": "Drainage", "code": "DRAIN", "head": "Sofia Chen", "email": "drainage@metropolis.gov", "desc": "Storm drains, flood channels, and underground culverts"}
        ]
        departments = {}
        for d in depts_data:
            dept = db.query(Department).filter(Department.code == d["code"]).first()
            if not dept:
                dept = Department(
                    name=d["name"],
                    code=d["code"],
                    head_name=d["head"],
                    contact_email=d["email"],
                    description=d["desc"],
                    contact_phone="+1 800-CIVIC-01"
                )
                db.add(dept)
                db.flush()
            departments[d["code"]] = dept

        # 4. Create Staff Workers (12 members across departments)
        staff_data = [
            {"id": "EMP-1001", "name": "Kumar Thorne", "dept": "ROAD", "role": "Senior Paving Specialist", "rating": 4.9, "tasks": 48, "done": 45, "hours": 3.8, "status": "ACTIVE"},
            {"id": "EMP-1002", "name": "Elena Gomez", "dept": "ROAD", "role": "Field Asphalt Crew Lead", "rating": 4.7, "tasks": 39, "done": 36, "hours": 4.2, "status": "ACTIVE"},
            {"id": "EMP-1003", "name": "Marcus Washington", "dept": "WATER", "role": "Master Pipe Inspector", "rating": 4.8, "tasks": 42, "done": 38, "hours": 3.4, "status": "ACTIVE"},
            {"id": "EMP-1004", "name": "Amina Al-Mansoor", "dept": "WATER", "role": "Hydraulics Technician", "rating": 4.9, "tasks": 35, "done": 33, "hours": 4.0, "status": "ACTIVE"},
            {"id": "EMP-1005", "name": "Devraj Patel", "dept": "SANI", "role": "Waste Logistics Supervisor", "rating": 4.6, "tasks": 55, "done": 52, "hours": 2.9, "status": "ACTIVE"},
            {"id": "EMP-1006", "name": "Chloe Bennett", "dept": "SANI", "role": "Rapid Response Operator", "rating": 4.8, "tasks": 44, "done": 41, "hours": 3.1, "status": "ACTIVE"},
            {"id": "EMP-1007", "name": "Tariq Owens", "dept": "ELEC", "role": "High Voltage Line Tech", "rating": 4.9, "tasks": 38, "done": 35, "hours": 2.8, "status": "ACTIVE"},
            {"id": "EMP-1008", "name": "Jessica Miller", "dept": "ELEC", "role": "Streetlight Grid Inspector", "rating": 4.7, "tasks": 31, "done": 29, "hours": 3.2, "status": "ACTIVE"},
            {"id": "EMP-1009", "name": "Vikram Sethi", "dept": "DRAIN", "role": "Drainage Network Engineer", "rating": 4.8, "tasks": 36, "done": 33, "hours": 4.5, "status": "ACTIVE"},
            {"id": "EMP-1010", "name": "Samantha Wu", "dept": "DRAIN", "role": "Culvert Maintenance Specialist", "rating": 4.6, "tasks": 28, "done": 25, "hours": 4.1, "status": "ACTIVE"},
            {"id": "EMP-1011", "name": "Arthur Pendelton", "dept": "ROAD", "role": "Heavy Equipment Operator", "rating": 4.5, "tasks": 24, "done": 20, "hours": 5.0, "status": "ON_LEAVE"},
            {"id": "EMP-1012", "name": "Farhan Qureshi", "dept": "SANI", "role": "Environmental Sanitation Officer", "rating": 4.4, "tasks": 19, "done": 17, "hours": 3.9, "status": "ACTIVE"}
        ]
        
        staff_objs = []
        for s in staff_data:
            existing_s = db.query(Staff).filter(Staff.employee_id == s["id"]).first()
            if not existing_s:
                staff_member = Staff(
                    employee_id=s["id"],
                    name=s["name"],
                    email=f"{s['name'].lower().replace(' ', '.')}@civiceye.local",
                    phone=f"+1 (555) 018-{random.randint(1000, 9999)}",
                    department_id=departments[s["dept"]].id,
                    designation=s["role"],
                    employment_status=s["status"],
                    tasks_assigned=s["tasks"],
                    tasks_completed=s["done"],
                    tasks_pending=s["tasks"] - s["done"],
                    avg_completion_hours=s["hours"],
                    attendance_rate=round(random.uniform(94.0, 98.5), 1),
                    citizen_rating=s["rating"],
                    avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={s['name']}",
                    joining_date=date(2023, random.randint(1, 12), random.randint(1, 28))
                )
                db.add(staff_member)
                staff_objs.append(staff_member)
            else:
                staff_objs.append(existing_s)
        db.flush()

        # 5. Populate Exact Target KPI Numbers:
        # Total Issues: 248
        # Pending: 61
        # In Progress: 32
        # Resolved: 155
        # High Priority: 23
        print("Generating 248 Realistic Smart City Civic Issues...")

        categories_spec = [
            ("Pothole", "ROAD", "HIGH", "Deep hazardous asphalt depression causing severe traffic slowdowns"),
            ("Garbage", "SANI", "MEDIUM", "Accumulated municipal waste bin overflow near pedestrian walkway"),
            ("Streetlight Damage", "ELEC", "MEDIUM", "Broken lighting fixture rendering urban corridor unsafe at night"),
            ("Water Leakage", "WATER", "HIGH", "High pressure water pipe breach flooding road sub-base"),
            ("Road Damage", "ROAD", "CRITICAL", "Extensive structural road subsidence and cracked bitumen"),
            ("Drainage Issue", "DRAIN", "HIGH", "Clogged stormwater catch basin causing localized pooling"),
            ("Fallen Tree", "SANI", "CRITICAL", "Heavy branch fallen across traffic lane following wind storm")
        ]

        sample_images = {
            "Pothole": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800",
            "Road Damage": "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=800",
            "Garbage": "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=800",
            "Streetlight Damage": "https://images.unsplash.com/photo-1508873696983-2df570464756?w=800",
            "Water Leakage": "https://images.unsplash.com/photo-1583508915901-b5f84c1dcde1?w=800",
            "Drainage Issue": "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800",
            "Fallen Tree": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800"
        }

        # Metropolis City Bounds (centered around 40.7128, -74.0060)
        base_lat, base_lng = 40.7128, -74.0060
        wards = ["Ward 1 Downtown", "Ward 2 Harbor", "Ward 3 North", "Ward 4 Civic Center", "Ward 5 University", "Ward 6 Tech Corridor", "Ward 7 West End"]

        # Exact target distribution:
        # 155 RESOLVED
        # 61 PENDING (REPORTED, PENDING_REVIEW, VERIFIED)
        # 32 IN_PROGRESS (ASSIGNED, IN_PROGRESS, VERIFICATION)
        # Sum = 248
        # High Priority count = 23 (distributed primarily across active issues)

        statuses_pool = (
            ["RESOLVED"] * 155 +
            ["REPORTED"] * 30 +
            ["PENDING_REVIEW"] * 18 +
            ["VERIFIED"] * 13 +
            ["ASSIGNED"] * 12 +
            ["IN_PROGRESS"] * 15 +
            ["VERIFICATION"] * 5
        )
        random.seed(42) # Deterministic for consistent Expo demonstration
        random.shuffle(statuses_pool)

        created_issues = []
        high_priority_assigned = 0

        for idx, status in enumerate(statuses_pool):
            ticket_code = f"CV-{1001 + idx}"
            cat_tuple = categories_spec[idx % len(categories_spec)]
            cat_name = cat_tuple[0]
            dept_code = cat_tuple[1]
            default_sev = cat_tuple[2]

            # Manage high priority quota (target 23)
            if high_priority_assigned < 23 and (status != "RESOLVED" or high_priority_assigned < 8):
                priority = "HIGH" if random.random() > 0.3 else "CRITICAL"
                high_priority_assigned += 1
            else:
                priority = "MEDIUM" if random.random() > 0.25 else "LOW"

            lat = round(base_lat + random.uniform(-0.06, 0.06), 6)
            lng = round(base_lng + random.uniform(-0.07, 0.07), 6)
            ward = wards[idx % len(wards)]
            address = f"{100 + (idx * 7) % 900} Metro Boulevard, {ward}"

            # Dates
            days_ago = random.randint(1, 20) if status == "RESOLVED" else random.randint(0, 5)
            created_time = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=random.randint(1, 12))
            resolved_time = created_time + timedelta(hours=random.randint(6, 48)) if status == "RESOLVED" else None

            # AI detection confidence
            ai_conf = round(random.uniform(0.89, 0.97), 2)
            
            issue = Issue(
                ticket_code=ticket_code,
                citizen_id=citizen_user.id,
                category=cat_name,
                verified_category=cat_name if status not in ["REPORTED", "PENDING_REVIEW"] else None,
                description=f"{cat_tuple[3]}. High impact on daily commuters.",
                image_url=sample_images.get(cat_name, sample_images["Pothole"]),
                latitude=lat,
                longitude=lng,
                address=address,
                ward=ward,
                ai_classification=cat_name,
                ai_confidence=ai_conf,
                ai_severity=default_sev,
                priority=priority,
                department_id=departments[dept_code].id,
                status=status,
                is_verified_by_manager=status not in ["REPORTED", "PENDING_REVIEW"],
                verified_by_id=manager_user.id if status not in ["REPORTED", "PENDING_REVIEW"] else None,
                manager_notes="Triage verified per smart city SLA." if status not in ["REPORTED", "PENDING_REVIEW"] else None,
                created_at=created_time,
                resolved_at=resolved_time
            )
            db.add(issue)
            db.flush()
            created_issues.append(issue)

            # AI Analysis record
            db.add(AIAnalysis(
                issue_id=issue.id,
                model_name="YOLOv8-CivicVision-v2.1",
                is_demo_mode=False,
                predicted_category=cat_name,
                confidence=ai_conf,
                severity=default_sev,
                detected_objects=[{"label": cat_name, "confidence": ai_conf, "bbox": [120, 150, 480, 360], "severity": default_sev}],
                inference_time_ms=round(random.uniform(42.0, 58.5), 1),
                created_at=created_time
            ))

            # Status History
            db.add(IssueStatusHistory(
                issue_id=issue.id,
                from_status=None,
                to_status="REPORTED",
                changed_by_id=citizen_user.id,
                comment="Reported with geolocation and photo by citizen",
                created_at=created_time
            ))

            if status != "REPORTED":
                db.add(IssueStatusHistory(
                    issue_id=issue.id,
                    from_status="REPORTED",
                    to_status="VERIFIED",
                    changed_by_id=manager_user.id,
                    comment="Verified by Manager. Priority confirmed.",
                    created_at=created_time + timedelta(hours=1)
                ))

            # Work Orders for In-Progress and Resolved issues
            if status in ["ASSIGNED", "IN_PROGRESS", "VERIFICATION", "RESOLVED"]:
                worker = random.choice([w for w in staff_objs if w.department_id == departments[dept_code].id] or staff_objs)
                wo_status = "VERIFIED" if status == "RESOLVED" else ("WORK_COMPLETED" if status == "VERIFICATION" else ("WORK_STARTED" if status == "IN_PROGRESS" else "ASSIGNED"))
                
                wo = WorkOrder(
                    order_code=f"WO-{3000 + len(created_issues)}",
                    issue_id=issue.id,
                    department_id=departments[dept_code].id,
                    worker_id=worker.id,
                    manager_id=manager_user.id,
                    priority=priority,
                    instructions=f"Dispatch maintenance crew to {address}. Repair {cat_name.lower()} immediately.",
                    status=wo_status,
                    deadline=created_time.date() + timedelta(days=2),
                    started_at=created_time + timedelta(hours=2) if wo_status != "ASSIGNED" else None,
                    completed_at=resolved_time if wo_status in ["WORK_COMPLETED", "VERIFIED"] else None,
                    verified_at=resolved_time if wo_status == "VERIFIED" else None,
                    created_at=created_time + timedelta(hours=1)
                )
                db.add(wo)
                db.flush()

                # For Resolved issues, add Before/After visual evidence
                if status == "RESOLVED":
                    db.add(WorkEvidence(
                        issue_id=issue.id,
                        work_order_id=wo.id,
                        before_image_url=issue.image_url,
                        after_image_url="https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=800",
                        description="Comprehensive restoration completed and inspected.",
                        uploaded_by_id=manager_user.id,
                        is_verified=True,
                        verified_at=resolved_time,
                        created_at=resolved_time
                    ))

                    # Add Citizen Feedback
                    rating = 5 if random.random() > 0.25 else 4
                    db.add(CitizenFeedback(
                        issue_id=issue.id,
                        citizen_id=citizen_user.id,
                        resolved_status="YES",
                        rating=rating,
                        comment=random.choice([
                            "Excellent response time and clean repair!",
                            "The road is smooth again, thank you CivicEye team!",
                            "Great work by the municipal crew.",
                            "Fixed within 24 hours. Highly impressed."
                        ]),
                        created_at=resolved_time + timedelta(hours=2)
                    ))

        # 6. Sample Resignation and Administrative Actions
        db.add(ResignationRequest(
            staff_id=staff_objs[10].id, # Arthur Pendelton
            request_date=date.today() - timedelta(days=5),
            requested_last_date=date.today() + timedelta(days=25),
            reason="Relocating to another metropolitan region for personal family commitments.",
            comments="Offered 30-day knowledge transfer period.",
            status="UNDER_REVIEW"
        ))

        db.add(AdministrativeAction(
            staff_id=staff_objs[0].id, # Kumar Thorne
            action_type="COMMENDATION",
            reason="Recognized for fastest resolution of 45 civic road work orders with 4.9 rating.",
            created_by_id=manager_user.id,
            reviewer_id=admin_user.id,
            is_approved=True,
            final_status="AWARDED"
        ))

        # 7. Notifications
        notifs = [
            (manager_user.id, "High-Priority Alert", "Critical road damage reported at Ward 4 Civic Center.", "ALERT", "/manager/issues/1"),
            (manager_user.id, "Staff Resignation Review", "Arthur Pendelton submitted a formal resignation request.", "RESIGNATION", "/manager/staff"),
            (manager_user.id, "Citizen Feedback Received", "Sarah Jenkins rated work order WO-3001 5 stars.", "INFO", "/manager/feedback"),
            (citizen_user.id, "Work Order Assigned", "Your reported pothole CV-1001 has been dispatched to Kumar Thorne.", "WORK_ORDER", "/citizen/report/1"),
            (citizen_user.id, "Issue Resolved!", "Your report CV-1001 is fixed! Tap here to inspect Before/After photos and rate service.", "ISSUE", "/citizen/report/1")
        ]
        for uid, title, msg, ntype, link in notifs:
            db.add(Notification(user_id=uid, title=title, message=msg, type=ntype, link=link, is_read=False))

        # 8. Audit Logs
        actions = ["LOGIN", "ISSUE_CREATED", "ISSUE_VERIFIED", "WORK_ORDER_CREATED", "WORK_COMPLETED", "WORK_VERIFIED", "FEEDBACK_CREATED"]
        for act in actions:
            db.add(AuditLog(
                user_id=manager_user.id,
                user_email=manager_user.email,
                action=act,
                entity="Issue",
                entity_id="CV-1001",
                new_value={"status": "UPDATED", "triage": "VERIFIED"},
                ip_address="127.0.0.1",
                timestamp=datetime.now(timezone.utc) - timedelta(minutes=random.randint(5, 120))
            ))

        db.commit()
        print(f"SUCCESS: Seeded {len(created_issues)} issues, 12 staff, work orders, feedback and notifications.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database(force_reset=True)
