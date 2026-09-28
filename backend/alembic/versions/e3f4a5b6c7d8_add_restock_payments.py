"""add restock payments (quote columns + restock_payments table)

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-09-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3f4a5b6c7d8'
down_revision: Union[str, Sequence[str], None] = 'd2e3f4a5b6c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Longest new status is 'balance_submitted' (17), the old column was 20 wide; widen to leave headroom
    op.alter_column('restock_requests', 'status', existing_type=sa.String(length=20), type_=sa.String(length=30), existing_nullable=False)

    op.add_column('restock_requests', sa.Column('unit_price', sa.Float(), nullable=True))
    op.add_column('restock_requests', sa.Column('total_amount', sa.Float(), nullable=True))
    op.add_column('restock_requests', sa.Column('deposit_amount', sa.Float(), nullable=True))
    op.add_column('restock_requests', sa.Column('balance_amount', sa.Float(), nullable=True))
    op.add_column('restock_requests', sa.Column('payment_instructions', sa.Text(), nullable=True))

    op.create_table(
        'restock_payments',
        sa.Column('payment_id', sa.Integer(), primary_key=True, index=True),
        sa.Column('request_id', sa.Integer(), sa.ForeignKey('restock_requests.request_id', ondelete='CASCADE'), nullable=False),
        sa.Column('kind', sa.String(length=10), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('method', sa.String(length=50), nullable=False),
        sa.Column('reference_no', sa.String(length=100), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=15), nullable=False, server_default='submitted'),
        sa.Column('paid_by', sa.Integer(), sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('paid_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('confirmed_by', sa.Integer(), sa.ForeignKey('users.user_id'), nullable=True),
        sa.Column('confirmed_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_restock_payments_request_id', 'restock_payments', ['request_id'])

    # 'received' is now called 'completed'. Requests that were already 'shipped' keep that status
    # and finish through the legacy path (no quote, so no payment is owed).
    op.execute("UPDATE restock_requests SET status = 'completed' WHERE status = 'received'")


def downgrade() -> None:
    op.execute("UPDATE restock_requests SET status = 'received' WHERE status IN ('completed', 'awaiting_balance', 'balance_submitted')")
    op.drop_index('ix_restock_payments_request_id', table_name='restock_payments')
    op.drop_table('restock_payments')
    op.drop_column('restock_requests', 'payment_instructions')
    op.drop_column('restock_requests', 'balance_amount')
    op.drop_column('restock_requests', 'deposit_amount')
    op.drop_column('restock_requests', 'total_amount')
    op.drop_column('restock_requests', 'unit_price')
    op.alter_column('restock_requests', 'status', existing_type=sa.String(length=30), type_=sa.String(length=20), existing_nullable=False)
