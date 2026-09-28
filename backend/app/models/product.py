from datetime import date
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
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

    # Optional percentage discount, only in effect between discount_start and discount_end (inclusive)
    discount_percent = Column(Float, nullable=True)
    discount_start = Column(Date, nullable=True)
    discount_end = Column(Date, nullable=True)


    product_variants = relationship("ProductVariant", back_populates="product", passive_deletes=True)

    @property
    def discount_active(self) -> bool:
        if not self.discount_percent or self.discount_percent <= 0:
            return False
        today = date.today()
        if self.discount_start and today < self.discount_start:
            return False
        if self.discount_end and today > self.discount_end:
            return False
        return True

    @property
    def effective_price(self) -> float:
        if self.discount_active:
            return round(self.base_price * (1 - self.discount_percent / 100), 2)
        return self.base_price
