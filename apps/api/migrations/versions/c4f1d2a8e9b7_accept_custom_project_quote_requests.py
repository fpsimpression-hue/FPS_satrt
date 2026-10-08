"""accept custom project quote requests

Revision ID: c4f1d2a8e9b7
Revises: a3eb7f9855e6
Create Date: 2026-10-08 14:20:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c4f1d2a8e9b7'
down_revision: Union[str, None] = 'a3eb7f9855e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # A quote request may now describe a custom project instead of a catalogue product.
    op.alter_column('quote_requests', 'product_id', existing_type=sa.Uuid(), nullable=True)
    op.alter_column('quote_requests', 'variant_id', existing_type=sa.Uuid(), nullable=True)
    op.add_column('quote_requests', sa.Column('project_category', sa.String(length=40), nullable=True))
    op.add_column('quote_requests', sa.Column('dimensions', sa.String(length=200), nullable=True))
    op.add_column('quote_requests', sa.Column('desired_date', sa.Date(), nullable=True))
    op.add_column(
        'quote_requests',
        sa.Column('design_help', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    )
    op.create_check_constraint(
        'ck_quote_request_subject',
        'quote_requests',
        '(product_id IS NOT NULL AND variant_id IS NOT NULL) OR project_category IS NOT NULL',
    )
    # Orders created from a custom project keep their label without a catalogue product.
    op.alter_column('order_items', 'product_id', existing_type=sa.Uuid(), nullable=True)
    op.alter_column('order_items', 'variant_id', existing_type=sa.Uuid(), nullable=True)


def downgrade() -> None:
    # Fails on purpose while custom-project rows exist, so no request is silently lost.
    op.alter_column('order_items', 'variant_id', existing_type=sa.Uuid(), nullable=False)
    op.alter_column('order_items', 'product_id', existing_type=sa.Uuid(), nullable=False)
    op.drop_constraint('ck_quote_request_subject', 'quote_requests', type_='check')
    op.drop_column('quote_requests', 'design_help')
    op.drop_column('quote_requests', 'desired_date')
    op.drop_column('quote_requests', 'dimensions')
    op.drop_column('quote_requests', 'project_category')
    op.alter_column('quote_requests', 'variant_id', existing_type=sa.Uuid(), nullable=False)
    op.alter_column('quote_requests', 'product_id', existing_type=sa.Uuid(), nullable=False)
