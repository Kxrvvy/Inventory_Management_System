from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal

from app.schemas.restock_payment import RestockPaymentResponse


class RestockRequestCreate(BaseModel):
    variant_id: int
    requested_quantity: int


class RestockRequestRespond(BaseModel):
    action: Literal["quote", "decline"]
    quantity: Optional[int] = None
    unit_price: Optional[float] = None
    payment_instructions: Optional[str] = None
    note: Optional[str] = None


class RestockRequestShip(BaseModel):
    note: Optional[str] = None


class RestockRequestResponse(BaseModel):
    request_id: int
    variant_id: int
    product_name: str
    size: str
    color: str
    quantity_in_stock: int
    stock_threshold: int
    max_stock: int
    requested_by: int
    requested_by_username: str
    requested_quantity: int
    status: str
    manufacturer_id: Optional[int] = None
    manufacturer_username: Optional[str] = None
    response_quantity: Optional[int] = None
    response_note: Optional[str] = None
    unit_price: Optional[float] = None
    total_amount: Optional[float] = None
    deposit_amount: Optional[float] = None
    balance_amount: Optional[float] = None
    payment_instructions: Optional[str] = None
    payments: list[RestockPaymentResponse] = []
    requested_at: datetime
    responded_at: Optional[datetime] = None
    received_by: Optional[int] = None
    received_by_username: Optional[str] = None
    received_at: Optional[datetime] = None
