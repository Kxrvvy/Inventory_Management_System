from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.sql import func


class RestockRequest(Base):
    __tablename__ = "restock_requests"

    request_id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.variant_id", ondelete="CASCADE"), nullable=False)
    requested_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    requested_quantity = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="pending")  # pending, declined, shipped, received

    # Set once the manufacturer responds
    manufacturer_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    response_quantity = Column(Integer, nullable=True)
    response_note = Column(Text, nullable=True)  # decline reason, or an optional shipping note

    requested_at = Column(DateTime, server_default=func.now())
    responded_at = Column(DateTime, nullable=True)

    # Set once the admin confirms the shipment arrived
    received_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    received_at = Column(DateTime, nullable=True)

    product_variant = relationship("ProductVariant", back_populates="restock_requests")
    requested_by_user = relationship("User", foreign_keys=[requested_by])
    manufacturer = relationship("User", foreign_keys=[manufacturer_id])
    received_by_user = relationship("User", foreign_keys=[received_by])
