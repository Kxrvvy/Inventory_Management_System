from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.utils.security import verify_token
from app.models.user import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    
    print("=== GET_CURRENT_USER CALLED ===")
    print("TOKEN:", token[:20] if token else "NO TOKEN")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    print("PAYLOAD:", payload)
    
    if payload is None:
        print("PAYLOAD IS NONE - RAISING 401")
        raise credentials_exception
    
    user_id: int = payload.get("sub")
    print("USER_ID:", user_id)
    
    if user_id is None:
        print("USER_ID IS NONE - RAISING 401")
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.user_id == int(user_id)))
    user = result.scalar_one_or_none()
    print("USER FOUND:", user)
    
    if user is None:
        print("USER IS NONE - RAISING 401")
        raise credentials_exception
    
    return user

async def require_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

async def require_staff(current_user: User = Depends(get_current_user)):
    if not current_user.is_staff():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff privileges required"
        )
    return current_user