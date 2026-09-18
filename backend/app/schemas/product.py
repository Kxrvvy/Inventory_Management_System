from pydantic import BaseModel
from typing import Optional

class ProductCreate(BaseModel):
    item_name: str
    base_price: float
    category: str
    image_url: Optional[str] = None
    status: Optional[str] = "active"

class ProductUpdate(BaseModel):
    item_name: Optional[str] = None
    base_price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = None

class ProductResponse(BaseModel):
    product_id: int
    item_name: str
    base_price: float
    category: str
    image_url: Optional[str] = None
    status: str

    class Config:
        from_attributes = True