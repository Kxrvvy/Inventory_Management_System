"""add max_stock to product_variants

Revision ID: d2e3f4a5b6c7
Revises: c9d8e7f6a5b4
Create Date: 2026-09-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd2e3f4a5b6c7'
down_revision: Union[str, Sequence[str], None] = 'c9d8e7f6a5b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('product_variants', sa.Column('max_stock', sa.Integer(), nullable=False, server_default='50'))
    # Existing variants that already hold more than the default keep their current level as the cap
    op.execute("UPDATE product_variants SET max_stock = quantity_in_stock WHERE quantity_in_stock > 50")


def downgrade() -> None:
    op.drop_column('product_variants', 'max_stock')
