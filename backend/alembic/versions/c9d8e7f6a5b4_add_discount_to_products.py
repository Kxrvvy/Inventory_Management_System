"""add discount fields to products

Revision ID: c9d8e7f6a5b4
Revises: b7c8d9e0f1a2
Create Date: 2026-09-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9d8e7f6a5b4'
down_revision: Union[str, Sequence[str], None] = 'b7c8d9e0f1a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('discount_percent', sa.Float(), nullable=True))
    op.add_column('products', sa.Column('discount_start', sa.Date(), nullable=True))
    op.add_column('products', sa.Column('discount_end', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('products', 'discount_end')
    op.drop_column('products', 'discount_start')
    op.drop_column('products', 'discount_percent')
