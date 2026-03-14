import os
import uuid
import logging
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.document import Document, ExtractionResult, DocumentStatus, AuditLog
from ..config import settings
from .ocr_service import perform_ocr
from .ai_extraction_service import extract_invoice_data
from .email_service import notify_document_completed, notify_document_failed

logger = logging.getLogger(__name__)


def add_audit(db: Session, document_id: int, action: str, actor_name: str = None, detail: dict = None):
    """Append an audit log entry (caller must commit)."""
    db.add(AuditLog(document_id=document_id, action=action, actor_name=actor_name, detail=detail))


def save_uploaded_file(file_content: bytes, original_filename: str) -> tuple[str, str, str]:
    """Save an uploaded file to disk. Returns (file_path, stored_filename, file_type)."""
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(original_filename).suffix.lower().lstrip(".")
    unique_name = f"{uuid.uuid4().hex}_{original_filename}"
    file_path = upload_dir / unique_name

    with open(file_path, "wb") as f:
        f.write(file_content)

    return str(file_path), unique_name, ext


def process_document(document_id: int, db: Session) -> None:
    """Full processing pipeline: OCR -> AI extraction -> save results."""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        logger.error(f"Document {document_id} not found")
        return

    try:
        # Step 1: Update status to processing
        document.status = DocumentStatus.processing
        add_audit(db, document_id, "processing_started", actor_name="system")
        db.commit()

        # Step 2: OCR
        logger.info(f"Starting OCR for document {document_id}")
        ocr_text = perform_ocr(document.file_path, document.file_type)
        document.ocr_text = ocr_text

        # Step 3: AI extraction
        logger.info(f"Starting AI extraction for document {document_id}")
        extracted = extract_invoice_data(ocr_text)

        # Step 4: Save extraction results
        existing = db.query(ExtractionResult).filter(
            ExtractionResult.document_id == document_id
        ).first()
        if existing:
            db.delete(existing)
            db.flush()

        result = ExtractionResult(
            document_id=document_id,
            invoice_number=extracted.get("invoice_number"),
            company_name=extracted.get("company_name"),
            invoice_date=extracted.get("invoice_date"),
            total_amount=extracted.get("total_amount"),
            confidence_score=extracted.get("confidence_score", 0.0),
            raw_extraction=extracted,
        )
        db.add(result)

        # Step 5: Mark completed
        document.status = DocumentStatus.completed
        document.processed_date = datetime.utcnow()
        add_audit(db, document_id, "processing_completed", actor_name="system",
                  detail={"company": extracted.get("company_name"), "amount": extracted.get("total_amount")})
        db.commit()
        logger.info(f"Document {document_id} processed successfully")

        # Send email notification (fire-and-forget; never blocks or raises)
        try:
            owner = document.owner
            if owner and owner.email_notifications:
                notify_document_completed(
                    user_email=owner.email,
                    username=owner.username,
                    filename=document.original_filename,
                    doc_id=document.id,
                )
        except Exception as email_err:
            logger.warning(f"Email notification failed for document {document_id}: {email_err}")

    except Exception as e:
        logger.error(f"Processing failed for document {document_id}: {e}")
        document.status = DocumentStatus.failed
        document.error_message = str(e)
        add_audit(db, document_id, "processing_failed", actor_name="system", detail={"error": str(e)})
        db.commit()

        # Send failure email notification (fire-and-forget; never blocks or raises)
        try:
            owner = document.owner
            if owner and owner.email_notifications:
                notify_document_failed(
                    user_email=owner.email,
                    username=owner.username,
                    filename=document.original_filename,
                    doc_id=document.id,
                )
        except Exception as email_err:
            logger.warning(f"Failure email notification skipped for document {document_id}: {email_err}")
