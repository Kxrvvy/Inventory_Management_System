"""add status to users

Revision ID: f3a1b2c4d5e6
Revises: c4e9a1f30b72
Create Date: 2026-06-22 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'f3a1b2c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'c4e9a1f30b72'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('status', sa.String(length=20), nullable=False, server_default='active'))


def downgrade() -> None:
    op.drop_column('users', 'status')
