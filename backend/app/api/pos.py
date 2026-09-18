from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models import ProductVariant, Transaction, SalesInvoice, Product
from app.database import get_db
from app.dependencies import require_staff
from app.schemas import POSCreate, POSResponse


router = APIRouter()

@router.post("/transaction",  summary="Process Sale", description="Processes a POS transaction. Deducts inventory and saves transaction records.")
async def transaction(
    pos_data: POSCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_staff)
):
    
    # Validate all items before processing
    
    total_amount = 0
    validated_items = []
    
    for item in pos_data.items:
        
        result = await db.execute(select(ProductVariant)
                                  .options(selectinload(ProductVariant.product))
                                  .where(ProductVariant.variant_id == item.variant_id))
        variant = result.scalar_one_or_none()
        
        if not variant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Variant ID {item.variant_id} not found"
            )
            
        # check if variant has enough stock
        if variant.quantity_in_stock < item.quantity_sold:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for variant ID {item.variant_id}. Available: {variant.quantity_in_stock}, Requested: {item.quantity_sold}"
            )
            
        # Calculate Total amount 
        actual_price = variant.product.base_price
        total_amount += actual_price * item.quantity_sold
        validated_items.append((variant, item, actual_price))
        
    # check if amount tendered is enough
    
    if pos_data.amount_tendered < total_amount:
        raise HTTPException(
             status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Amount tendered is less than total amount. Total: {total_amount}, Tendered: {pos_data.amount_tendered}"
        )
        
    #Create Transaction
    
    transaction = Transaction(
        user_id = current_user.user_id,
        payment_method = pos_data.payment_method,
        total_amount = total_amount
    )
    
    db.add(transaction)
    await db.flush()
    
    invoices = []
    
    for variant, item, actual_price in validated_items:
        invoice = SalesInvoice(
            transaction_id = transaction.transaction_id,
            variant_id = item.variant_id,
            quantity_sold = item.quantity_sold,
            unit_price = actual_price
        )
        
        db.add(invoice)
        
        #deduct inventory
        
        variant.quantity_in_stock -= item.quantity_sold
        invoices.append(invoice)
        
    await db.commit()
    await db.refresh(transaction)
    
    # calculate change
    change = pos_data.amount_tendered - total_amount

    return {
        "transaction_id": transaction.transaction_id,
        "user_id": transaction.user_id,
        "payment_method": transaction.payment_method,
        "total_amount": total_amount,
        "amount_tendered": pos_data.amount_tendered,
        "change": change,
        "purchased_at": transaction.purchased_at,
        "items": [
            {
                "invoice_id": invoice.invoice_id,
                "variant_id": invoice.variant_id,
                "quantity_sold": invoice.quantity_sold,
                "unit_price": invoice.unit_price
            }
            for invoice in invoices
        ]
    }
