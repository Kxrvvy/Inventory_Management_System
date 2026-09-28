from sqlalchemy import Column, Integer, Float, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.sql import func


class RestockPayment(Base):
    __tablename__ = "restock_payments"

    payment_id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("restock_requests.request_id", ondelete="CASCADE"), nullable=False, index=True)
    kind = Column(String(10), nullable=False)  # deposit, balance
    amount = Column(Float, nullable=False)
    method = Column(String(50), nullable=False)
    reference_no = Column(String(100), nullable=False)
    note = Column(Text, nullable=True)
    status = Column(String(15), nullable=False, default="submitted")  # submitted, confirmed

    # Recorded by the admin
    paid_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    paid_at = Column(DateTime, server_default=func.now())

    # Confirmed by the manufacturer
    confirmed_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    confirmed_at = Column(DateTime, nullable=True)

    restock_request = relationship("RestockRequest", back_populates="payments")
    paid_by_user = relationship("User", foreign_keys=[paid_by])
    confirmed_by_user = relationship("User", foreign_keys=[confirmed_by])
