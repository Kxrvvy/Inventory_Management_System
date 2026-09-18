"""
reconcile_inventory.py — Subtract all recorded sales (sales_invoices)
from product_variants.quantity_in_stock so inventory reflects actual sales.

Run ONCE after seeding transactions:
    python reconcile_inventory.py
"""

import asyncio
from sqlalchemy.future import select
from sqlalchemy.sql import func

from app.database import AsyncSessionLocal
from app.models.product_variant import ProductVariant
from app.models.sales_invoice import SalesInvoice


async def reconcile():
    async with AsyncSessionLocal() as db:

        # Sum total quantity sold per variant across all transactions
        result = await db.execute(
            select(
                SalesInvoice.variant_id,
                func.sum(SalesInvoice.quantity_sold).label("total_sold")
            )
            .group_by(SalesInvoice.variant_id)
        )
        sold_map = {row.variant_id: row.total_sold for row in result.all()}

        if not sold_map:
            print("No sales invoices found — nothing to reconcile.")
            return

        # Apply deductions
        variant_result = await db.execute(
            select(ProductVariant).where(ProductVariant.variant_id.in_(sold_map.keys()))
        )
        variants = variant_result.scalars().all()

        zeroed = 0
        for variant in variants:
            sold = sold_map.get(variant.variant_id, 0)
            new_qty = max(0, variant.quantity_in_stock - sold)
            if new_qty == 0:
                zeroed += 1
            variant.quantity_in_stock = new_qty

        await db.commit()

        print(f"Reconciled {len(variants)} variants.")
        print(f"  {zeroed} variant(s) hit 0 stock after deduction.")
        print("Done.")


if __name__ == "__main__":
    asyncio.run(reconcile())
