from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.utils.security import verify_password, create_access_token
from app.dependencies import get_current_user
from sqlalchemy.future import select

router = APIRouter()

@router.post("/login", summary="Login", description="Authenticates a user and returns a JWT token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    
    print(f"DEBUG: Received username: {form_data.username}")
    
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalar_one_or_none()
    
    #if not user or not verify_password(form_data.password, user.password):
    if not user:
        print(f"DEBUG: User '{form_data.username}' not found in database.")
        raise HTTPException(status_code=401, detail="User not found")

    print(f"DEBUG: Attempting to verify user: {user.username}")
    print(f"DEBUG: Stored hash length: {len(user.password)}")
    
    is_valid = verify_password(form_data.password, user.password)
    print(f"DEBUG: Password verification result: {is_valid}")
    
    if not is_valid:
        raise HTTPException(status_code=401, detail="Incorrect password")



    if getattr(user, 'status', 'active') == 'inactive':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact your administrator.",
        )
        
    access_token = create_access_token(data={
        "sub": str(user.user_id),
        "username": user.username,
        "role": user.role
    })
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }
    
@router.get("/me", summary="Get Current User", description="Returns the currently authenticated user's information")
async def read_current_user(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "created_at": current_user.created_at
    }