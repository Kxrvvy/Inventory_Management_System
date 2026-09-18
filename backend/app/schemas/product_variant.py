from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductVariantCreate(BaseModel):
    product_id: int
    size: str
    color: str
    stock_threshold: int
    quantity_in_stock: int
    image_url: Optional[str] = None
    
class ProductVariantUpdate(BaseModel):
    size: Optional[str] = None
    color: Optional[str] = None
    stock_threshold: Optional[int] = None
    quantity_in_stock: Optional[int] = None
    
class ProductVariantResponse(BaseModel):
    variant_id: int
    product_id: int
    size: str
    color: str
    stock_threshold: int
    quantity_in_stock: int
    image_url: Optional[str] = None
    status: str

    class Config:
        from_attributes = True
        
class LowStockResponse(BaseModel):
    variant_id: int
    product_name: str
    size: str
    color: str
    quantity_in_stock: int
    stock_threshold: int
    
    class Config:
        from_attributes = True