from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from app.database import get_db
from app.dependencies import require_admin, require_manufacturer, require_role
from app.models import RestockRequest, RestockPayment, ProductVariant, RestockHistory
from app.models.restock_request import ACTIVE_STATUSES
from app.schemas import (
    RestockRequestCreate, RestockRequestRespond, RestockRequestShip, RestockRequestResponse,
    RestockPaymentCreate, RestockPaymentResponse,
)

router = APIRouter()


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _load_options():
    return (
        selectinload(RestockRequest.product_variant).selectinload(ProductVariant.product),
        selectinload(RestockRequest.requested_by_user),
        selectinload(RestockRequest.manufacturer),
        selectinload(RestockRequest.received_by_user),
        selectinload(RestockRequest.payments).selectinload(RestockPayment.paid_by_user),
        selectinload(RestockRequest.payments).selectinload(RestockPayment.confirmed_by_user),
    )


def _payment_to_response(p: RestockPayment) -> RestockPaymentResponse:
    return RestockPaymentResponse(
        payment_id=p.payment_id,
        request_id=p.request_id,
        kind=p.kind,
        amount=p.amount,
        method=p.method,
        reference_no=p.reference_no,
        note=p.note,
        status=p.status,
        paid_by=p.paid_by,
        paid_by_username=p.paid_by_user.username,
        paid_at=p.paid_at,
        confirmed_by=p.confirmed_by,
        confirmed_by_username=p.confirmed_by_user.username if p.confirmed_by_user else None,
        confirmed_at=p.confirmed_at,
    )


def _require_owning_manufacturer(req: RestockRequest, current_user) -> None:
    """After a quote, the request belongs to the manufacturer who quoted it."""
    if req.manufacturer_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This request belongs to another manufacturer")


def _to_response(req: RestockRequest) -> RestockRequestResponse:
    return RestockRequestResponse(
        request_id=req.request_id,
        variant_id=req.variant_id,
        product_name=req.product_variant.product.item_name,
        size=req.product_variant.size,
        color=req.product_variant.color,
        quantity_in_stock=req.product_variant.quantity_in_stock,
        stock_threshold=req.product_variant.stock_threshold,
        max_stock=req.product_variant.max_stock,
        requested_by=req.requested_by,
        requested_by_username=req.requested_by_user.username,
        requested_quantity=req.requested_quantity,
        status=req.status,
        manufacturer_id=req.manufacturer_id,
        manufacturer_username=req.manufacturer.username if req.manufacturer else None,
        response_quantity=req.response_quantity,
        response_note=req.response_note,
        unit_price=req.unit_price,
        total_amount=req.total_amount,
        deposit_amount=req.deposit_amount,
        balance_amount=req.balance_amount,
        payment_instructions=req.payment_instructions,
        payments=[_payment_to_response(p) for p in req.payments],
        requested_at=req.requested_at,
        responded_at=req.responded_at,
        received_by=req.received_by,
        received_by_username=req.received_by_user.username if req.received_by_user else None,
        received_at=req.received_at,
    )


async def _get_loaded(db: AsyncSession, request_id: int) -> RestockRequest:
    # populate_existing: the session keeps objects after commit, so without it a re-fetch would
    # hand back the same instance with stale relationships (e.g. a payment just added wouldn't show)
    result = await db.execute(
        select(RestockRequest)
        .options(*_load_options())
        .where(RestockRequest.request_id == request_id)
        .execution_options(populate_existing=True)
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restock request not found")
    return req


@router.post("/", summary="Request Restock", description="Admin only. Sends a restock request to the manufacturer for a single variant.")
async def create_restock_request(
    request_data: RestockRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin)
) -> RestockRequestResponse:

    result = await db.execute(select(ProductVariant).where(ProductVariant.variant_id == request_data.variant_id))
    variant = result.scalar_one_or_none()
    if not variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")

    if request_data.requested_quantity <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Requested quantity must be greater than zero")

    # Reorders are capped by the variant's maximum stock level
    room = variant.max_stock - variant.quantity_in_stock
    if room <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock is already full ({variant.quantity_in_stock} of {variant.max_stock}), so it can't be reordered"
        )
    if request_data.requested_quantity > room:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You can only reorder up to {room} more (in stock {variant.quantity_in_stock}, max {variant.max_stock})"
        )

    existing = await db.execute(
        select(RestockRequest).where(
            RestockRequest.variant_id == request_data.variant_id,
            RestockRequest.status.in_(ACTIVE_STATUSES)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An active restock request already exists for this variant")

    new_request = RestockRequest(
        variant_id=request_data.variant_id,
        requested_by=current_user.user_id,
        requested_quantity=request_data.requested_quantity,
        status="pending"
    )
    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)

    return _to_response(await _get_loaded(db, new_request.request_id))


@router.get("/", summary="List Restock Requests", description="Admin or manufacturer. Lists restock requests, optionally filtered by status/variant.")
async def list_restock_requests(
    request_status: Optional[str] = Query(None, alias="status"),
    variant_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin", "manufacturer"))
) -> list[RestockRequestResponse]:

    query = select(RestockRequest).options(*_load_options()).order_by(RestockRequest.requested_at.desc())
    if request_status:
        query = query.where(RestockRequest.status == request_status)
    if variant_id:
        query = query.where(RestockRequest.variant_id == variant_id)

    result = await db.execute(query)
    requests = result.scalars().all()
    return [_to_response(r) for r in requests]


@router.patch("/{request_id}/respond", summary="Respond to Restock Request", description="Manufacturer only. Quote a quantity and unit price (with payment instructions) or decline the request.")
async def respond_to_restock_request(
    request_id: int,
    respond_data: RestockRequestRespond,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_manufacturer)
) -> RestockRequestResponse:

    req = await _get_loaded(db, request_id)

    if req.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This request has already been responded to")

    if respond_data.action == "quote":
        if not respond_data.quantity or respond_data.quantity <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be greater than zero")
        if not respond_data.unit_price or respond_data.unit_price <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unit price must be greater than zero")
        instructions = (respond_data.payment_instructions or "").strip()
        if not instructions:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment instructions are required so the admin knows where to pay")

        # Decimal so half-cents round predictably (float 249.975 would round down)
        cents = Decimal("0.01")
        total = (Decimal(respond_data.quantity) * Decimal(str(respond_data.unit_price))).quantize(cents, ROUND_HALF_UP)
        deposit = (total / 2).quantize(cents, ROUND_HALF_UP)

        req.status = "quoted"
        req.response_quantity = respond_data.quantity
        req.unit_price = respond_data.unit_price
        req.total_amount = float(total)
        req.deposit_amount = float(deposit)
        req.balance_amount = float(total - deposit)  # derived so deposit + balance always equals total
        req.payment_instructions = instructions
    else:
        req.status = "declined"

    req.manufacturer_id = current_user.user_id
    req.response_note = respond_data.note
    req.responded_at = _now()

    await db.commit()

    return _to_response(await _get_loaded(db, request_id))


@router.patch("/{request_id}/accept", summary="Accept Quote", description="Admin only. Accepts the manufacturer's quote; the deposit is then due.")
async def accept_quote(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin)
) -> RestockRequestResponse:

    req = await _get_loaded(db, request_id)

    if req.status != "quoted":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only quoted requests can be accepted")

    req.status = "awaiting_deposit"
    await db.commit()

    return _to_response(await _get_loaded(db, request_id))


@router.patch("/{request_id}/reject", summary="Reject Quote", description="Admin only. Rejects the manufacturer's quote and cancels the request.")
async def reject_quote(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin)
) -> RestockRequestResponse:

    req = await _get_loaded(db, request_id)

    if req.status != "quoted":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only quoted requests can be rejected")

    req.status = "cancelled"
    await db.commit()

    return _to_response(await _get_loaded(db, request_id))


@router.post("/{request_id}/payments", summary="Record Payment", description="Admin only. Records the deposit (after accepting the quote) or the balance (after arrival). The amount is fixed by the quote.")
async def record_payment(
    request_id: int,
    payment_data: RestockPaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin)
) -> RestockRequestResponse:

    req = await _get_loaded(db, request_id)

    if req.status == "awaiting_deposit":
        kind, amount, next_status = "deposit", req.deposit_amount, "deposit_submitted"
    elif req.status == "awaiting_balance":
        kind, amount, next_status = "balance", req.balance_amount, "balance_submitted"
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No payment is due on this request right now")

    db.add(RestockPayment(
        request_id=req.request_id,
        kind=kind,
        amount=amount,
        method=payment_data.method.strip(),
        reference_no=payment_data.reference_no.strip(),
        note=payment_data.note,
        status="submitted",
        paid_by=current_user.user_id,
    ))
    req.status = next_status
    await db.commit()

    return _to_response(await _get_loaded(db, request_id))


@router.patch("/{request_id}/payments/{payment_id}/confirm", summary="Confirm Payment", description="Manufacturer only. Confirms a submitted deposit (unlocks shipping) or balance (completes the order).")
async def confirm_payment(
    request_id: int,
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_manufacturer)
) -> RestockRequestResponse:

    req = await _get_loaded(db, request_id)
    _require_owning_manufacturer(req, current_user)

    payment = next((p for p in req.payments if p.payment_id == payment_id), None)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found on this request")
    if payment.status != "submitted":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This payment has already been confirmed")

    # The payment must be the one the request is currently waiting on
    if payment.kind == "deposit" and req.status == "deposit_submitted":
        req.status = "deposit_paid"
    elif payment.kind == "balance" and req.status == "balance_submitted":
        req.status = "completed"
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This payment isn't awaiting confirmation")

    payment.status = "confirmed"
    payment.confirmed_by = current_user.user_id
    payment.confirmed_at = _now()
    await db.commit()

    return _to_response(await _get_loaded(db, request_id))


@router.patch("/{request_id}/ship", summary="Ship Order", description="Manufacturer only. Marks a request whose deposit is confirmed as shipped.")
async def ship_restock_request(
    request_id: int,
    ship_data: RestockRequestShip,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_manufacturer)
) -> RestockRequestResponse:

    req = await _get_loaded(db, request_id)
    _require_owning_manufacturer(req, current_user)

    if req.status != "deposit_paid":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An order can only be shipped once its deposit is confirmed")

    req.status = "shipped"
    if ship_data.note:
        req.response_note = ship_data.note

    await db.commit()

    return _to_response(await _get_loaded(db, request_id))


@router.patch("/{request_id}/receive", summary="Confirm Received", description="Admin only. Confirms a shipped request arrived, updates stock, and makes the balance due.")
async def receive_restock_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin)
) -> RestockRequestResponse:

    req = await _get_loaded(db, request_id)

    if req.status != "shipped":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only shipped requests can be marked as received")

    req.product_variant.quantity_in_stock += req.response_quantity

    restock_log = RestockHistory(
        variant_id=req.variant_id,
        user_id=current_user.user_id,
        quantity_added=req.response_quantity,
        restock_request_id=req.request_id
    )
    db.add(restock_log)

    # Requests shipped before payments existed have no quote, so nothing is owed and they close here
    req.status = "completed" if req.total_amount is None else "awaiting_balance"
    req.received_by = current_user.user_id
    req.received_at = _now()

    await db.commit()

    return _to_response(await _get_loaded(db, request_id))
