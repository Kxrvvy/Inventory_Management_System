"""add restock_requests

Revision ID: d1e2f3a4b5c6
Revises: e5d074ed3d4f
Create Date: 2026-09-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, Sequence[str], None] = 'e5d074ed3d4f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'restock_requests',
        sa.Column('request_id', sa.Integer(), primary_key=True, index=True),
        sa.Column('variant_id', sa.Integer(), sa.ForeignKey('product_variants.variant_id', ondelete='CASCADE'), nullable=False),
        sa.Column('requested_by', sa.Integer(), sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('requested_quantity', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('manufacturer_id', sa.Integer(), sa.ForeignKey('users.user_id'), nullable=True),
        sa.Column('response_quantity', sa.Integer(), nullable=True),
        sa.Column('response_note', sa.Text(), nullable=True),
        sa.Column('requested_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('responded_at', sa.DateTime(), nullable=True),
        sa.Column('received_by', sa.Integer(), sa.ForeignKey('users.user_id'), nullable=True),
        sa.Column('received_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_restock_requests_status', 'restock_requests', ['status'])
    op.create_index('ix_restock_requests_variant_id', 'restock_requests', ['variant_id'])

    op.add_column(
        'restock_history',
        sa.Column('restock_request_id', sa.Integer(), sa.ForeignKey('restock_requests.request_id', ondelete='SET NULL'), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('restock_history', 'restock_request_id')
    op.drop_index('ix_restock_requests_variant_id', table_name='restock_requests')
    op.drop_index('ix_restock_requests_status', table_name='restock_requests')
    op.drop_table('restock_requests')
