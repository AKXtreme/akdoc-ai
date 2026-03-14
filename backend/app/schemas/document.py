from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from datetime import datetime
from ..models.document import DocumentStatus, DocumentType


class ExtractionResultOut(BaseModel):
    id: int
    invoice_number: Optional[str]
    company_name: Optional[str]
    invoice_date: Optional[str]
    total_amount: Optional[float]
    corrected_invoice_number: Optional[str]
    corrected_company_name: Optional[str]
    corrected_invoice_date: Optional[str]
    corrected_total_amount: Optional[float]
    is_reviewed: bool
    confidence_score: Optional[float]
    raw_extraction: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class ExtractionResultUpdate(BaseModel):
    corrected_invoice_number: Optional[str] = None
    corrected_company_name: Optional[str] = None
    corrected_invoice_date: Optional[str] = None
    corrected_total_amount: Optional[float] = None


class AuditLogOut(BaseModel):
    id: int
    action: str
    actor_name: Optional[str]
    detail: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentCreate(BaseModel):
    document_type: DocumentType = DocumentType.invoice


class DocumentOut(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: Optional[int]
    status: DocumentStatus
    document_type: DocumentType
    upload_date: datetime
    processed_date: Optional[datetime]
    owner_id: int
    error_message: Optional[str]
    tags: Optional[List[str]] = []
    extraction: Optional[ExtractionResultOut]

    class Config:
        from_attributes = True


class DocumentListOut(BaseModel):
    total: int
    page: int
    page_size: int
    documents: list[DocumentOut]
