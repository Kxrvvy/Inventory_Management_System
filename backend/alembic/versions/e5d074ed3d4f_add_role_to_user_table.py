"""add role to user table

Revision ID: e5d074ed3d4f
Revises: 97ae28d2e315
Create Date: 2026-06-23 18:41:01.759571

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5d074ed3d4f'
down_revision: Union[str, Sequence[str], None] = '97ae28d2e315'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
