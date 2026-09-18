from pydantic import BaseModel
from typing import Optional

class SalesInvoiceCreate(BaseModel):
    variant_id: int
    quantity_sold: int

class SalesInvoiceResponse(BaseModel):
    invoice_id: int
    transaction_id: int
    variant_id: int
    quantity_sold: int
    unit_price: float

    class Config:
        from_attributes = True