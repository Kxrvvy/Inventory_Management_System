from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.dependencies import require_admin, require_staff
from app.models import ProductVariant, Product
from app.schemas import ProductVariantCreate, ProductVariantResponse, ProductVariantUpdate 


router = APIRouter()

@router.post("/", summary="Create Variant", description="Admin only. Adds a variant to a product.")
async def add_variant(
    variant_data: ProductVariantCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
) -> ProductVariantResponse:
    
    #Check if the product exist
    result = await db.execute(select(Product).where(Product.product_id == variant_data.product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    result = await db.execute(select(ProductVariant).where(ProductVariant.product_id == variant_data.product_id,
                                                          ProductVariant.size == variant_data.size,
                                                          ProductVariant.color == variant_data.color))
    existing_variant = result.scalar_one_or_none()
    
    if existing_variant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Variant with this size and color already exists for this product"
        )
        
    new_variant = ProductVariant(
        product_id = variant_data.product_id,
        size = variant_data.size,
        color = variant_data.color,
        stock_threshold = variant_data.stock_threshold,
        quantity_in_stock = variant_data.quantity_in_stock,
        image_url = variant_data.image_url,
    )
    
    db.add(new_variant)
    await db.commit()
    await db.refresh(new_variant)
    
    return new_variant


@router.get("/product/{product_id}", summary="Get Product Variants", description="Returns all variants of a product.")
async def get_variants_by_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_staff)
) -> list[ProductVariantResponse]:
    
    result = await db.execute(select(Product).where(Product.product_id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
        
    result = await db.execute(select(ProductVariant).where(ProductVariant.product_id == product_id))
    variants = result.scalars().all()
    
    return variants

@router.get("/{variant_id}", summary="Get Product Variants", description="Returns all variants of a product.")
async def get_variant(
    variant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_staff)
) -> ProductVariantResponse:
    
    result = await db.execute(select(ProductVariant).where(ProductVariant.variant_id == variant_id))
    variant = result.scalar_one_or_none()
    
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variant not found"
        )
        
    return variant

@router.put("/{variant_id}", summary="Update Variant", description="Admin only. Updates a variant's details.")
async def update_variant(
    variant_id: int,
    variant_data: ProductVariantUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
) -> ProductVariantResponse:
    
    
    result = await db.execute(select(ProductVariant).where(ProductVariant.variant_id == variant_id))
    variant = result.scalar_one_or_none()
    
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variant not found"
        )
        
    if variant_data.size is not None:
        variant.size = variant_data.size
    if variant_data.color is not None:
        variant.color = variant_data.color
    if variant_data.stock_threshold is not None:
        variant.stock_threshold = variant_data.stock_threshold
    if variant_data.quantity_in_stock is not None:
        variant.quantity_in_stock = variant_data.quantity_in_stock
    
    
    await db.commit()
    await db.refresh(variant)

    return variant


@router.delete("/{variant_id}", summary="Delete Variant", description="Admin only. Deletes a variant.")
async def delete_variant(
    variant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
) -> ProductVariantResponse:
    
    result = await db.execute(select(ProductVariant).where(ProductVariant.variant_id == variant_id))
    variant_delete = result.scalar_one_or_none()
    
    if not variant_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variant not found"
        )
        
    await db.delete(variant_delete)
    await db.commit()

    return {"message": "Variant deleted successfully"}