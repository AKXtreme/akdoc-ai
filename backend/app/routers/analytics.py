from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case
from ..database import get_db
from ..models.document import Document, ExtractionResult, DocumentStatus
from ..models.user import User, UserRole
from ..middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary")
def get_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return analytics summary stats."""
    base = db.query(Document)
    if current_user.role != UserRole.admin:
        base = base.filter(Document.owner_id == current_user.id)

    total_documents = base.count()
    completed = base.filter(Document.status == DocumentStatus.completed).count()
    failed = base.filter(Document.status == DocumentStatus.failed).count()
    pending = base.filter(Document.status == DocumentStatus.pending).count()
    processing = base.filter(Document.status == DocumentStatus.processing).count()

    # Total invoice amounts
    extraction_query = db.query(func.sum(ExtractionResult.total_amount))
    if current_user.role != UserRole.admin:
        extraction_query = extraction_query.join(Document).filter(Document.owner_id == current_user.id)
    total_amount = extraction_query.scalar() or 0.0

    return {
        "total_documents": total_documents,
        "completed": completed,
        "failed": failed,
        "pending": pending,
        "processing": processing,
        "total_invoice_amount": round(total_amount, 2),
        "success_rate": round(completed / total_documents * 100, 1) if total_documents > 0 else 0,
    }


@router.get("/monthly-trends")
def get_monthly_trends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return monthly document count and invoice totals for the past 12 months."""
    doc_query = db.query(
        extract("year", Document.upload_date).label("year"),
        extract("month", Document.upload_date).label("month"),
        func.count(Document.id).label("count"),
    )
    if current_user.role != UserRole.admin:
        doc_query = doc_query.filter(Document.owner_id == current_user.id)
    monthly_docs = doc_query.group_by("year", "month").order_by("year", "month").limit(12).all()

    amount_query = db.query(
        extract("year", Document.upload_date).label("year"),
        extract("month", Document.upload_date).label("month"),
        func.sum(ExtractionResult.total_amount).label("total"),
    ).join(ExtractionResult)
    if current_user.role != UserRole.admin:
        amount_query = amount_query.filter(Document.owner_id == current_user.id)
    monthly_amounts = amount_query.group_by("year", "month").order_by("year", "month").limit(12).all()

    amount_map = {(int(r.year), int(r.month)): r.total or 0 for r in monthly_amounts}

    return [
        {
            "year": int(r.year),
            "month": int(r.month),
            "document_count": r.count,
            "total_amount": round(amount_map.get((int(r.year), int(r.month)), 0), 2),
        }
        for r in monthly_docs
    ]


@router.get("/vendors")
def get_vendor_stats(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return top vendors by document count and total invoice amount."""
    company_expr = func.coalesce(
        ExtractionResult.corrected_company_name,
        ExtractionResult.company_name,
    ).label("company")

    amount_expr = func.coalesce(
        ExtractionResult.corrected_total_amount,
        ExtractionResult.total_amount,
    )

    query = db.query(
        company_expr,
        func.count(Document.id).label("document_count"),
        func.sum(amount_expr).label("total_amount"),
        func.avg(amount_expr).label("avg_amount"),
        func.max(amount_expr).label("max_amount"),
    ).join(ExtractionResult, Document.id == ExtractionResult.document_id)

    if current_user.role != UserRole.admin:
        query = query.filter(Document.owner_id == current_user.id)

    results = (
        query
        .filter(company_expr.isnot(None))
        .group_by(company_expr)
        .order_by(func.count(Document.id).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "company": r.company,
            "document_count": r.document_count,
            "total_amount": round(r.total_amount or 0, 2),
            "avg_amount": round(r.avg_amount or 0, 2),
            "max_amount": round(r.max_amount or 0, 2),
        }
        for r in results
    ]
