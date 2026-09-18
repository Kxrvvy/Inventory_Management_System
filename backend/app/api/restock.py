from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import RestockHistory, ProductVariant
from app.schemas import RestockCreate, RestockResponse
from app.dependencies import require_admin

router = APIRouter()

@router.post("/", summary="Restock Variant", description="Admin only. Adds stock to a variant and logs the restock history.")
async def restock_product(
    restock_data: RestockCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
) -> RestockResponse:
    
    
    # check if variant exist
    result = await db.execute(select(ProductVariant).where(ProductVariant.variant_id == restock_data.variant_id))
    variant = result.scalar_one_or_none()
    
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variant not found"
        )
        
    # check the validity of stock amount
    if restock_data.quantity_added <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity added must be greater than zero"
        )
        
    # add the the remaining stock and the added stock
    variant.quantity_in_stock += restock_data.quantity_added
        
    # Log the restock history
    restock_log = RestockHistory(
        variant_id = restock_data.variant_id,
        user_id = current_user.user_id,
        quantity_added = restock_data.quantity_added
    )
    
    db.add(restock_log)
    await db.commit()
    await db.refresh(restock_log)
    
    return restock_log


@router.get("/variant/{variant_id}", summary="Get Restock History", description="Admin only. Returns restock history for a specific variant.")
async def get_restock_history(
    variant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
) -> list[RestockResponse]:
    
    result = await db.execute(select(ProductVariant).where(ProductVariant.variant_id == variant_id))
    variant = result.scalar_one_or_none()
    
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variant not found"
        )
        
    result = await db.execute(select(RestockHistory).where(RestockHistory.variant_id == variant_id))
    variant_history = result.scalars().all()
    
    return variant_history


@router.get("/", summary="Get All Restock History", description="Admin only. Returns all restock history.")
async def get_all_restock_history(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
) -> list[RestockResponse]:
    
    result = await db.execute(select(RestockHistory))
    history = result.scalars().all()
    
    return history
    