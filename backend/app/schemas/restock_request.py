from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal


class RestockRequestCreate(BaseModel):
    variant_id: int
    requested_quantity: int


class RestockRequestRespond(BaseModel):
    action: Literal["ship", "decline"]
    quantity: Optional[int] = None
    note: Optional[str] = None


class RestockRequestResponse(BaseModel):
    request_id: int
    variant_id: int
    product_name: str
    size: str
    color: str
    requested_by: int
    requested_by_username: str
    requested_quantity: int
    status: str
    manufacturer_id: Optional[int] = None
    manufacturer_username: Optional[str] = None
    response_quantity: Optional[int] = None
    response_note: Optional[str] = None
    requested_at: datetime
    responded_at: Optional[datetime] = None
    received_by: Optional[int] = None
    received_by_username: Optional[str] = None
    received_at: Optional[datetime] = None
