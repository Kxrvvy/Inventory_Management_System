from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TransactionCreate(BaseModel):
    payment_method: str

class TransactionResponse(BaseModel):
    transaction_id: int
    user_id: int
    payment_method: str
    total_amount: float
    purchased_at: datetime

    class Config:
        from_attributes = True