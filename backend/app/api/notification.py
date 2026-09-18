from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.dependencies import require_staff
from app.models import ProductVariant
from app.schemas import LowStockResponse, ProductVariantResponse


router = APIRouter()


@router.get("/low-stock", summary="Alert low stock", description="Alert the system of low stock products")
async def low_stock_alert(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_staff)
) -> list[LowStockResponse]:

    result = await db.execute(select(ProductVariant)
                              .options(selectinload(ProductVariant.product))
                              .where(ProductVariant.quantity_in_stock <= ProductVariant.stock_threshold))

    variant_stock_alert = result.scalars().all()

    low_stock_list = []

    for variant in variant_stock_alert:
        low_stock_list.append(LowStockResponse(
            variant_id=variant.variant_id,
            product_name=variant.product.item_name,
            size=variant.size,
            color=variant.color,
            quantity_in_stock=variant.quantity_in_stock,
            stock_threshold=variant.stock_threshold
        ))

    return low_stock_list


@router.get("/stock-level", summary = "Show stock level", description = "Show all of the products' stock level")
async def stock_level(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_staff)
) -> list[ProductVariantResponse]:
    
    result = await db.execute(select(ProductVariant)
                              .order_by(ProductVariant.quantity_in_stock.asc()))
    
    variant = result.scalars().all()
    
    return variant