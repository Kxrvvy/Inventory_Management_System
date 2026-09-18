from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date


class UserCreate(BaseModel):
    username: str
    name: str
    email: EmailStr
    phone: str
    password: str
    dateHired: Optional[date] = None
    role: str
    
class UserUpdate(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    dateHired: Optional[date] = None
    password: Optional[str] = None
    status: Optional[str] = None
    role: str = None

class UserResponse(BaseModel):
    message: Optional[str] = None
    user_id: int
    name: Optional[str] = None
    username: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    dateHired: Optional[date] = None
    created_at: Optional[datetime]
    
    class Config:
        from_attributes = True
        
