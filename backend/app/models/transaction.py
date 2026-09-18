from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.sql import func


class Transaction(Base):
    __tablename__ = "transactions"
    
    transaction_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    payment_method = Column(String(50), nullable=False)
    total_amount = Column(Float, nullable=False)
    purchased_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="transactions")
    sales_invoices = relationship("SalesInvoice", back_populates="transaction")