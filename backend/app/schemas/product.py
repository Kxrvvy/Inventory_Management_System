from datetime import date
from pydantic import BaseModel, Field, model_validator
from typing import Optional


def _check_discount_dates(start, end):
    if start and end and end < start:
        raise ValueError("Discount end date cannot be before the start date.")


class ProductCreate(BaseModel):
    item_name: str
    base_price: float
    category: str
    image_url: Optional[str] = None
    status: Optional[str] = "active"
    discount_percent: Optional[float] = Field(default=None, ge=0, le=100)
    discount_start: Optional[date] = None
    discount_end: Optional[date] = None

    @model_validator(mode="after")
    def validate_discount_dates(self):
        _check_discount_dates(self.discount_start, self.discount_end)
        return self

class ProductUpdate(BaseModel):
    item_name: Optional[str] = None
    base_price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = None
    # Discount fields are cleared by sending null explicitly (see update_product)
    discount_percent: Optional[float] = Field(default=None, ge=0, le=100)
    discount_start: Optional[date] = None
    discount_end: Optional[date] = None

    @model_validator(mode="after")
    def validate_discount_dates(self):
        _check_discount_dates(self.discount_start, self.discount_end)
        return self

class ProductResponse(BaseModel):
    product_id: int
    item_name: str
    base_price: float
    category: str
    image_url: Optional[str] = None
    status: str
    discount_percent: Optional[float] = None
    discount_start: Optional[date] = None
    discount_end: Optional[date] = None
    discount_active: bool = False
    effective_price: float

    class Config:
        from_attributes = True
