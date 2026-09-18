from fastapi import APIRouter, Depends
from datetime import timedelta, datetime, timezone
from sqlalchemy.sql import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models import Transaction, SalesInvoice, ProductVariant
from sqlalchemy.orm import selectinload
from app.dependencies import require_admin
from app.database import get_db

router = APIRouter()


async def generate_report(db: AsyncSession, start_date: datetime, period: str):
    result = await db.execute(select(Transaction)
                              .where(Transaction.purchased_at >= start_date))
    report = result.scalars().all()

    total_sales = 0

    # get total sales
    for sales in report:
        total_sales += sales.total_amount

    total_transaction = len(report)

    avg_per_transaction = round(
        total_sales / total_transaction, 2) if total_transaction > 0 else 0

    top_items_result = await db.execute(
        select(SalesInvoice.variant_id,
               func.sum(SalesInvoice.quantity_sold).label("total_sold"))
        .join(Transaction, SalesInvoice.transaction_id == Transaction.transaction_id)
        .where(Transaction.purchased_at >= start_date)
        .group_by(SalesInvoice.variant_id)
        .order_by(func.sum(SalesInvoice.quantity_sold).desc())
        .limit(5))

    top_items = top_items_result.all()

    top_selling_items = []

    for item in top_items:
        variant_result = await db.execute(
            select(ProductVariant)
            .options(selectinload(ProductVariant.product))
            .where(ProductVariant.variant_id == item.variant_id)
        )
        variant = variant_result.scalar_one_or_none()

        top_selling_items.append({
            "product_name": variant.product.item_name,
            "variant_id": item.variant_id,
            "size": variant.size,
            "color": variant.color,
            "total_sold": item.total_sold
        })

    recent_tx_result = await db.execute(
        select(Transaction)
        .options(
            selectinload(Transaction.sales_invoices)
            .selectinload(SalesInvoice.product_variant)
            .selectinload(ProductVariant.product)
        )
        .where(Transaction.purchased_at >= start_date)
        .order_by(Transaction.purchased_at.desc())
    )
    recent_tx = recent_tx_result.scalars().all()

    recent_transactions = []
    for tx in recent_tx:
        items = []
        for inv in tx.sales_invoices:
            if inv.product_variant and inv.product_variant.product:
                items.append({
                    "product_name": inv.product_variant.product.item_name,
                    "size": inv.product_variant.size,
                    "color": inv.product_variant.color,
                    "quantity_sold": inv.quantity_sold,
                    "unit_price": inv.unit_price,
                })
        recent_transactions.append({
            "transaction_id": tx.transaction_id,
            "payment_method": tx.payment_method,
            "total_amount": tx.total_amount,
            "purchased_at": tx.purchased_at,
            "items": items,
        })

    return {
        "period": period,
        "total_sales": total_sales,
        "total_transaction": total_transaction,
        "avg_per_transaction": avg_per_transaction,
        "top_items": top_selling_items,
        "recent_transactions": recent_transactions
    }


@router.get("/daily", summary="Daily Report", description="Sales report everyday")
async def daily_report(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin)
):
    start_date = (datetime.now(timezone.utc) - timedelta(days=1)).replace(tzinfo=None)
    return await generate_report(db, start_date, "daily")


@router.get("/weekly", summary="Weekly Report", description="Sales report every week")
async def weekly_report(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin)
):
    start_date = (datetime.now(timezone.utc) - timedelta(days=7)).replace(tzinfo=None)
    return await generate_report(db, start_date, "weekly")


@router.get("/monthly", summary="Monthly Report", description="Sales report every month")
async def monthly_report(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin)
):
    start_date = (datetime.now(timezone.utc) - timedelta(days=30)).replace(tzinfo=None)
    return await generate_report(db, start_date, "monthly")
