from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.audit import AuditLog

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
    
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account")
    
    return user

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_roles = [r.name.upper() for r in current_user.roles]
        # Admin can access everything
        if "ADMIN" in user_roles:
            return current_user
        
        has_role = any(r.upper() in [ar.upper() for ar in allowed_roles] for r in user_roles)
        if not has_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Required role in {allowed_roles}"
            )
        return current_user
    return role_checker

def log_audit(
    db: Session,
    action: str,
    entity: str,
    entity_id: Optional[str] = None,
    user: Optional[User] = None,
    old_value: Optional[dict] = None,
    new_value: Optional[dict] = None,
    request: Optional[Request] = None
):
    try:
        ip = request.client.host if request and request.client else None
        user_id = user.id if user else None
        user_email = user.email if user else "SYSTEM"

        log_entry = AuditLog(
            user_id=user_id,
            user_email=user_email,
            action=action,
            entity=entity,
            entity_id=str(entity_id) if entity_id is not None else None,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
