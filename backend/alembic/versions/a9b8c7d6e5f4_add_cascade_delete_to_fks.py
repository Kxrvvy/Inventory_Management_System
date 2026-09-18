"""add_cascade_delete_to_fks

Revision ID: a9b8c7d6e5f4
Revises: f3a1b2c4d5e6
Create Date: 2026-06-22

"""
from typing import Sequence, Union
from alembic import op

revision: str = 'a9b8c7d6e5f4'
down_revision: Union[str, Sequence[str], None] = 'f3a1b2c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # product_variants.product_id → products.product_id
    op.drop_constraint('product_variants_product_id_fkey', 'product_variants', type_='foreignkey')
    op.create_foreign_key(
        'product_variants_product_id_fkey',
        'product_variants', 'products',
        ['product_id'], ['product_id'],
        ondelete='CASCADE'
    )

    # restock_history.variant_id → product_variants.variant_id
    op.drop_constraint('restock_history_variant_id_fkey', 'restock_history', type_='foreignkey')
    op.create_foreign_key(
        'restock_history_variant_id_fkey',
        'restock_history', 'product_variants',
        ['variant_id'], ['variant_id'],
        ondelete='CASCADE'
    )

    # sales_invoices.variant_id → product_variants.variant_id
    op.drop_constraint('sales_invoices_variant_id_fkey', 'sales_invoices', type_='foreignkey')
    op.create_foreign_key(
        'sales_invoices_variant_id_fkey',
        'sales_invoices', 'product_variants',
        ['variant_id'], ['variant_id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    op.drop_constraint('product_variants_product_id_fkey', 'product_variants', type_='foreignkey')
    op.create_foreign_key(
        'product_variants_product_id_fkey',
        'product_variants', 'products',
        ['product_id'], ['product_id']
    )

    op.drop_constraint('restock_history_variant_id_fkey', 'restock_history', type_='foreignkey')
    op.create_foreign_key(
        'restock_history_variant_id_fkey',
        'restock_history', 'product_variants',
        ['variant_id'], ['variant_id']
    )

    op.drop_constraint('sales_invoices_variant_id_fkey', 'sales_invoices', type_='foreignkey')
    op.create_foreign_key(
        'sales_invoices_variant_id_fkey',
        'sales_invoices', 'product_variants',
        ['variant_id'], ['variant_id']
    )
