"""add nickname to users

Revision ID: b7c8d9e0f1a2
Revises: d1e2f3a4b5c6
Create Date: 2026-09-28 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b7c8d9e0f1a2'
down_revision: Union[str, Sequence[str], None] = 'd1e2f3a4b5c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('nickname', sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'nickname')
