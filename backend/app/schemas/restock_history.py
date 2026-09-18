from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class RestockCreate(BaseModel):
    variant_id: int
    quantity_added: int

class RestockResponse(BaseModel):
    restock_id: int
    variant_id: int
    user_id: int
    quantity_added: int
    restock_date: datetime

    class Config:
        from_attributes = True