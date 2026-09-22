from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from typing import Optional

from app.database import get_db
from app.dependencies import require_admin, require_manufacturer, require_role
from app.models import RestockRequest, ProductVariant, RestockHistory
from app.schemas import RestockRequestCreate, RestockRequestRespond, RestockRequestResponse

router = APIRouter()


def _load_options():
    return (
        selectinload(RestockRequest.product_variant).selectinload(ProductVariant.product),
        selectinload(RestockRequest.requested_by_user),
        selectinload(RestockRequest.manufacturer),
        selectinload(RestockRequest.received_by_user),
    )


def _to_response(req: RestockRequest) -> RestockRequestResponse:
    return RestockRequestResponse(
        request_id=req.request_id,
        variant_id=req.variant_id,
        product_name=req.product_variant.product.item_name,
        size=req.product_variant.size,
        color=req.product_variant.color,
        requested_by=req.requested_by,
        requested_by_username=req.requested_by_user.username,
        requested_quantity=req.requested_quantity,
        status=req.status,
        manufacturer_id=req.manufacturer_id,
        manufacturer_username=req.manufacturer.username if req.manufacturer else None,
        response_quantity=req.response_quantity,
        response_note=req.response_note,
        requested_at=req.requested_at,
        responded_at=req.responded_at,
        received_by=req.received_by,
        received_by_username=req.received_by_user.username if req.received_by_user else None,
        received_at=req.received_at,
    )


async def _get_loaded(db: AsyncSession, request_id: int) -> RestockRequest:
    result = await db.execute(
        select(RestockRequest).options(*_load_options()).where(RestockRequest.request_id == request_id)
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

    existing = await db.execute(
        select(RestockRequest).where(
            RestockRequest.variant_id == request_data.variant_id,
            RestockRequest.status.in_(["pending", "shipped"])
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


@router.patch("/{request_id}/respond", summary="Respond to Restock Request", description="Manufacturer only. Ship a quantity or decline the request.")
async def respond_to_restock_request(
    request_id: int,
    respond_data: RestockRequestRespond,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_manufacturer)
) -> RestockRequestResponse:

    req = await _get_loaded(db, request_id)

    if req.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This request has already been responded to")

    if respond_data.action == "ship":
        if not respond_data.quantity or respond_data.quantity <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be greater than zero when shipping")
        req.status = "shipped"
        req.response_quantity = respond_data.quantity
    else:
        req.status = "declined"

    req.manufacturer_id = current_user.user_id
    req.response_note = respond_data.note
    req.responded_at = datetime.now(timezone.utc).replace(tzinfo=None)

    await db.commit()

    return _to_response(await _get_loaded(db, request_id))


@router.patch("/{request_id}/receive", summary="Confirm Received", description="Admin only. Confirms a shipped request arrived and updates stock.")
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

    req.status = "received"
    req.received_by = current_user.user_id
    req.received_at = datetime.now(timezone.utc).replace(tzinfo=None)

    await db.commit()

    return _to_response(await _get_loaded(db, request_id))
