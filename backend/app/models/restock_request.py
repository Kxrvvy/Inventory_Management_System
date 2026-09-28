from sqlalchemy import Column, Integer, Float, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.sql import func

# pending -> quoted -> awaiting_deposit -> deposit_submitted -> deposit_paid -> shipped
#   -> awaiting_balance -> balance_submitted -> completed
# Side exits: pending -> declined, quoted -> cancelled
TERMINAL_STATUSES = ("declined", "cancelled", "completed")
ACTIVE_STATUSES = (
    "pending", "quoted", "awaiting_deposit", "deposit_submitted", "deposit_paid",
    "shipped", "awaiting_balance", "balance_submitted",
)


class RestockRequest(Base):
    __tablename__ = "restock_requests"

    request_id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.variant_id", ondelete="CASCADE"), nullable=False)
    requested_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    requested_quantity = Column(Integer, nullable=False)
    status = Column(String(30), nullable=False, default="pending")

    # Set once the manufacturer responds
    manufacturer_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    response_quantity = Column(Integer, nullable=True)
    response_note = Column(Text, nullable=True)  # decline reason, or an optional shipping note

    # Quote from the manufacturer. Null on declined requests and on legacy requests that predate payments.
    unit_price = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True)
    deposit_amount = Column(Float, nullable=True)  # 50% of total, paid before shipping
    balance_amount = Column(Float, nullable=True)  # total - deposit, paid after arrival
    payment_instructions = Column(Text, nullable=True)  # where/how to pay (bank or e-wallet account, etc.)

    requested_at = Column(DateTime, server_default=func.now())
    responded_at = Column(DateTime, nullable=True)

    # Set once the admin confirms the shipment arrived
    received_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    received_at = Column(DateTime, nullable=True)

    product_variant = relationship("ProductVariant", back_populates="restock_requests")
    requested_by_user = relationship("User", foreign_keys=[requested_by])
    manufacturer = relationship("User", foreign_keys=[manufacturer_id])
    received_by_user = relationship("User", foreign_keys=[received_by])
    payments = relationship("RestockPayment", back_populates="restock_request", order_by="RestockPayment.payment_id", cascade="all, delete-orphan")
