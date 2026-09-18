from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.user import User
from app.utils.security import hash_password
from app.dependencies import require_admin
from app.schemas import UserCreate, UserUpdate, UserResponse

router = APIRouter()

@router.post("/", summary="Create User", description="Creates a new user (admin only)")
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
) -> UserResponse:
    
    result = await db.execute(select(User).where(User.username == user_data.username))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
        
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_email = result.scalar_one_or_none()
    
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    new_user = User(
        username=user_data.username,
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,        
        dateHired=user_data.dateHired,
        password=hash_password(user_data.password),
        role=user_data.role
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user
    
    
@router.get("/", summary="Get All Users", description="Admin only. Returns a list of all staff and admin accounts.")
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
) -> list[UserResponse]:
    
    result = await db.execute(select(User))
    users = result.scalars().all()
    
    return users
    
@router.put("/{user_id}", summary="Update User Role", description="Admin only. Update a user's details and role")
async def update_staff(
    user_id: int,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
) -> UserResponse:
    
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if user_data.username is not None:
        user.username = user_data.username
    if user_data.name is not None: 
        user.name = user_data.name
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.phone is not None:
        user.phone = user_data.phone    
    if user_data.dateHired is not None: 
        user.dateHired = user_data.dateHired
    if user_data.password:
        user.password = hash_password(user_data.password)
    if user_data.status is not None:
        user.status = user_data.status
    if user_data.role is not None:
        user.role = user_data.role

    await db.commit()
    await db.refresh(user)
    
    return user
    
@router.delete("/{user_id}", summary="Delete User", description="Admin only. Deletes a user account.")
async def deactivate_staff(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if user.user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
        
    await db.delete(user)
    await db.commit()
    
    return {
        "message": f"staff account '{user.username}' deleted successfully"}