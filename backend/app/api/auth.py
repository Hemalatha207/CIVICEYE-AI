from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.deps import get_current_user, require_role, log_audit
from app.models.user import User, Role, CitizenProfile
from app.models.staff import Staff
from app.models.department import Department
from app.schemas.auth import UserRegister, UserLogin, Token, UserOut, UserCreateByAdmin

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, request: Request, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # If first user in the entire system, grant ADMIN role automatically.
    # Otherwise, self-registration is strictly for citizens.
    user_count = db.query(User).count()
    if user_count == 0:
        role_name = "ADMIN"
    else:
        role_name = "CITIZEN"
        
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        role = Role(name=role_name, description=f"{role_name} Role")
        db.add(role)
        db.flush()

    new_user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        is_active=True,
        is_verified=True
    )
    new_user.roles.append(role)
    if role_name == "ADMIN":
        mgr_role = db.query(Role).filter(Role.name == "MANAGER").first()
        if mgr_role:
            new_user.roles.append(mgr_role)

    db.add(new_user)
    db.flush()

    # Create Citizen profile if citizen
    if role_name == "CITIZEN":
        profile = CitizenProfile(
            user_id=new_user.id,
            address=user_in.address or "Central Avenue",
            ward=user_in.ward or "Ward 4"
        )
        db.add(profile)

    db.commit()
    db.refresh(new_user)

    log_audit(db, action="USER_REGISTERED", entity="User", entity_id=str(new_user.id), user=new_user, request=request)

    access_token = create_access_token(new_user.id, role=role_name)
    refresh_token = create_refresh_token(new_user.id, role=role_name)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/create-user", response_model=UserOut)
def create_user_by_admin(
    user_in: UserCreateByAdmin,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    role_name = user_in.role.upper()
    if role_name not in ["ADMIN", "MANAGER", "CITIZEN"]:
        role_name = "MANAGER"

    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        role = Role(name=role_name, description=f"{role_name} Role")
        db.add(role)
        db.flush()

    new_user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        is_active=True,
        is_verified=True
    )
    new_user.roles.append(role)
    if role_name == "ADMIN":
        mgr_role = db.query(Role).filter(Role.name == "MANAGER").first()
        if mgr_role and mgr_role not in new_user.roles:
            new_user.roles.append(mgr_role)

    db.add(new_user)
    db.flush()

    # If department provided, link to staff profile
    if user_in.department_id:
        dept = db.query(Department).filter(Department.id == user_in.department_id).first()
        if dept:
            emp_count = db.query(Staff).count()
            staff = Staff(
                user_id=new_user.id,
                department_id=dept.id,
                employee_id=f"EMP-{1000 + emp_count + 1}",
                name=user_in.full_name,
                email=user_in.email.lower(),
                phone=user_in.phone_number,
                designation=user_in.designation or f"{role_name} Lead",
                employment_status="ACTIVE"
            )
            db.add(staff)

    db.commit()
    db.refresh(new_user)

    log_audit(db, action="ADMIN_CREATED_USER", entity="User", entity_id=str(new_user.id), user=current_user, new_value={"email": user_in.email, "role": role_name}, request=request)
    return new_user

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    primary_role = user.roles[0].name if user.roles else "CITIZEN"
    access_token = create_access_token(user.id, role=primary_role)
    refresh_token = create_refresh_token(user.id, role=primary_role)

    log_audit(db, action="LOGIN", entity="User", entity_id=str(user.id), user=user, request=request)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/refresh")
def refresh_token_endpoint(refresh_token: str, db: Session = Depends(get_db)):
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    primary_role = user.roles[0].name if user.roles else "CITIZEN"
    new_access_token = create_access_token(user.id, role=primary_role)
    new_refresh_token = create_refresh_token(user.id, role=primary_role)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_audit(db, action="LOGOUT", entity="User", entity_id=str(current_user.id), user=current_user, request=request)
    return {"message": "Successfully logged out"}
