from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.sql import func


class SalesInvoice(Base):
    __tablename__ = "sales_invoices"
    
    invoice_id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.transaction_id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.variant_id"), nullable=False)
    quantity_sold = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    
    transaction = relationship("Transaction", back_populates="sales_invoices")
    product_variant = relationship("ProductVariant", back_populates="sales_invoices")