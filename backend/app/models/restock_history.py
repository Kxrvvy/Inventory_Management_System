from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.sql import func


class RestockHistory(Base):
    __tablename__ = "restock_history"
    
    restock_id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.variant_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    quantity_added = Column(Integer, nullable=False)
    restock_date = Column(DateTime, default=func.now())
    
    product_variant = relationship("ProductVariant", back_populates="restock_history")
    user = relationship("User", back_populates="restock_history")