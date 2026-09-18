from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Product(Base):
    __tablename__ = "products"


    product_id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String(150), nullable=False)
    category = Column(String(150), nullable=False)
    base_price = Column(Float, nullable=False)
    image_url = Column(String(500), nullable=True)
    status = Column(String(50), nullable=False, default="active")


    product_variants = relationship("ProductVariant", back_populates="product", passive_deletes=True)
  