"""
seed_inventory.py — Populate Puppet's Directory with 10 products,
their variants, and 31+ days of transaction history.

Usage (from the backend/ folder):
    python seed_inventory.py
"""

import asyncio
import random
from datetime import datetime, timedelta

from sqlalchemy.future import select

from app.database import AsyncSessionLocal
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.transaction import Transaction
from app.models.sales_invoice import SalesInvoice
from app.models.user import User

# ── Product catalog ────────────────────────────────────────────────────────────
PRODUCTS = [
    # JACKETS (2)
    {
        "item_name": "Classic Denim Jacket",
        "category": "Jackets",
        "base_price": 1299.00,
        "colors": ["Black", "Indigo", "Stone Blue"],
        "sizes": ["S", "M", "L", "XL", "XXL"],
    },
    {
        "item_name": "Oversized Bomber Jacket",
        "category": "Jackets",
        "base_price": 1599.00,
        "colors": ["Black", "Olive", "Cream"],
        "sizes": ["S", "M", "L", "XL"],
    },
    # SHORTS (2)
    {
        "item_name": "Utility Cargo Shorts",
        "category": "Shorts",
        "base_price": 699.00,
        "colors": ["Khaki", "Black", "Army Green"],
        "sizes": ["S", "M", "L", "XL", "XXL"],
    },
    {
        "item_name": "Classic Denim Shorts",
        "category": "Shorts",
        "base_price": 799.00,
        "colors": ["Light Blue", "Black", "White"],
        "sizes": ["S", "M", "L", "XL"],
    },
    # PANTS (2)
    {
        "item_name": "Slim Fit Jeans",
        "category": "Pants",
        "base_price": 999.00,
        "colors": ["Dark Blue", "Black", "Grey"],
        "sizes": ["S", "M", "L", "XL", "XXL"],
    },
    {
        "item_name": "Classic Chino Pants",
        "category": "Pants",
        "base_price": 899.00,
        "colors": ["Khaki", "Navy", "Olive"],
        "sizes": ["S", "M", "L", "XL"],
    },
    # SHIRTS (2)
    {
        "item_name": "Essential Polo Shirt",
        "category": "Shirts",
        "base_price": 549.00,
        "colors": ["White", "Black", "Navy", "Red"],
        "sizes": ["S", "M", "L", "XL", "XXL"],
    },
    {
        "item_name": "Oversized Graphic Tee",
        "category": "Shirts",
        "base_price": 399.00,
        "colors": ["White", "Black", "Sand"],
        "sizes": ["S", "M", "L", "XL"],
    },
    # TANK TOPS (2)
    {
        "item_name": "Essential Tank Top",
        "category": "Tank Tops",
        "base_price": 299.00,
        "colors": ["White", "Black", "Grey"],
        "sizes": ["S", "M", "L", "XL"],
    },
    {
        "item_name": "Ribbed Knit Tank Top",
        "category": "Tank Tops",
        "base_price": 349.00,
        "colors": ["Cream", "Black", "Brown"],
        "sizes": ["S", "M", "L", "XL"],
    },
]

# Weighted toward cash to reflect a physical store
PAYMENT_METHODS = [
    "cash", "cash", "cash", "cash",
    "gcash", "gcash",
    "maya", "maya",
    "qrph",
]


async def seed_inventory():
    random.seed(42)  # reproducible data

    async with AsyncSessionLocal() as db:

        # ── Require admin user ─────────────────────────────────────────────────
        result = await db.execute(select(User).where(User.username == "admin"))
        admin = result.scalar_one_or_none()
        if not admin:
            print("ERROR: Admin user not found. Run `python seed.py` first.")
            return

        # ── Products & variants ────────────────────────────────────────────────
        result = await db.execute(select(Product))
        existing_products = result.scalars().all()

        if existing_products:
            print(f"Found {len(existing_products)} products — skipping product seed.")
        else:
            variant_count = 0
            low_stock_count = 0

            for p_data in PRODUCTS:
                product = Product(
                    item_name=p_data["item_name"],
                    category=p_data["category"],
                    base_price=p_data["base_price"],
                    status="active",
                )
                db.add(product)
                await db.flush()  # get product_id before adding variants

                for color in p_data["colors"]:
                    for size in p_data["sizes"]:
                        # ~10 % of variants are intentionally low-stock so the
                        # notification system has visible alerts to demonstrate.
                        if random.random() < 0.10:
                            qty = random.randint(1, 4)
                            low_stock_count += 1
                        else:
                            qty = random.randint(15, 50)

                        db.add(ProductVariant(
                            product_id=product.product_id,
                            size=size,
                            color=color,
                            quantity_in_stock=qty,
                            stock_threshold=5,
                            status="active",
                        ))
                        variant_count += 1

            await db.commit()
            print(
                f"Seeded {len(PRODUCTS)} products | "
                f"{variant_count} variants | "
                f"{low_stock_count} low-stock variants (for notification demo)"
            )

        # ── Transaction history ────────────────────────────────────────────────
        # Load all active variants with their parent product in one query
        rows = (await db.execute(
            select(ProductVariant, Product)
            .join(Product, ProductVariant.product_id == Product.product_id)
            .where(Product.status == "active", ProductVariant.status == "active")
        )).all()

        if not rows:
            print("No active variants found — skipping transactions.")
            return

        today = datetime.now()
        total_tx = 0
        total_items_sold = 0

        # 31 days ago → today (inclusive)
        for days_ago in range(31, -1, -1):
            date = today - timedelta(days=days_ago)

            # More foot traffic on weekends (Sat=5, Sun=6)
            is_weekend = date.weekday() >= 5
            num_tx = random.randint(5, 10) if is_weekend else random.randint(3, 7)

            for _ in range(num_tx):
                # 1–3 distinct products per transaction
                num_items = random.randint(1, 3)
                chosen = random.sample(rows, min(num_items, len(rows)))

                invoice_items = []
                total_amount = 0.0

                for variant, product in chosen:
                    qty = random.randint(1, 2)
                    price = product.base_price
                    total_amount += price * qty
                    total_items_sold += qty
                    invoice_items.append({
                        "variant_id": variant.variant_id,
                        "quantity_sold": qty,
                        "unit_price": price,
                    })

                # Random time within store hours 9 AM – 8 PM
                tx_time = date.replace(
                    hour=random.randint(9, 20),
                    minute=random.randint(0, 59),
                    second=random.randint(0, 59),
                    microsecond=0,
                )

                tx = Transaction(
                    user_id=admin.user_id,
                    payment_method=random.choice(PAYMENT_METHODS),
                    total_amount=round(total_amount, 2),
                    purchased_at=tx_time,
                )
                db.add(tx)
                await db.flush()

                for item in invoice_items:
                    db.add(SalesInvoice(
                        transaction_id=tx.transaction_id,
                        variant_id=item["variant_id"],
                        quantity_sold=item["quantity_sold"],
                        unit_price=item["unit_price"],
                    ))

                total_tx += 1

        await db.commit()
        print(
            f"Seeded {total_tx} transactions over 31 days | "
            f"~{total_items_sold} items sold across all methods "
            f"(cash / gcash / maya / qrph)"
        )
        print("Done.")


if __name__ == "__main__":
    asyncio.run(seed_inventory())
