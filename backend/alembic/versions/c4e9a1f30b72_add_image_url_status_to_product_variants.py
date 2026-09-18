"""add image_url and status to product_variants

Revision ID: c4e9a1f30b72
Revises: 6587420d732a
Create Date: 2026-06-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4e9a1f30b72'
down_revision: Union[str, Sequence[str], None] = '82ec899019a5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('product_variants', sa.Column('image_url', sa.String(length=500), nullable=True))
    op.add_column('product_variants', sa.Column('status', sa.String(length=50), nullable=False, server_default='active'))


def downgrade() -> None:
    op.drop_column('product_variants', 'status')
    op.drop_column('product_variants', 'image_url')
