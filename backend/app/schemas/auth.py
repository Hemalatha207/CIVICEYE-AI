from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    phone_number: Optional[str] = None
    role: Optional[str] = "CITIZEN" # CITIZEN, MANAGER, ADMIN
    address: Optional[str] = None
    ward: Optional[str] = None

class UserCreateByAdmin(BaseModel):
    email: str
    password: str
    full_name: str
    phone_number: Optional[str] = None
    role: str = "MANAGER"
    department_id: Optional[int] = None
    designation: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserOut"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None

class UserRoleOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone_number: Optional[str] = None
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None
    roles: List[UserRoleOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
