from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class RestockPaymentCreate(BaseModel):
    method: str = Field(min_length=1, max_length=50)
    reference_no: str = Field(min_length=1, max_length=100)
    note: Optional[str] = None


class RestockPaymentResponse(BaseModel):
    payment_id: int
    request_id: int
    kind: str
    amount: float
    method: str
    reference_no: str
    note: Optional[str] = None
    status: str
    paid_by: int
    paid_by_username: str
    paid_at: datetime
    confirmed_by: Optional[int] = None
    confirmed_by_username: Optional[str] = None
    confirmed_at: Optional[datetime] = None
