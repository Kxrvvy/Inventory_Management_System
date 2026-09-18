from pydantic import BaseModel
from typing import List
from app.schemas.sales_invoice import SalesInvoiceCreate, SalesInvoiceResponse
from app.schemas.transaction import TransactionResponse

class POSCreate(BaseModel):
    payment_method: str
    amount_tendered: float
    items: List[SalesInvoiceCreate]  # list of items being sold

class POSResponse(BaseModel):
    transaction: TransactionResponse
    invoices: List[SalesInvoiceResponse]
    total_amount: float
    change: float
    amount_tendered: float
    
    class Config:
        from_attribute = True