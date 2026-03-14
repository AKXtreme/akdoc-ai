from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database import Base


class DocumentStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"
    review_needed = "review_needed"


class DocumentType(str, enum.Enum):
    invoice = "invoice"
    receipt = "receipt"
    other = "other"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, jpg, png
    file_size = Column(Integer)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.pending)
    document_type = Column(Enum(DocumentType), default=DocumentType.invoice)
    ocr_text = Column(Text)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    processed_date = Column(DateTime(timezone=True))
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    error_message = Column(Text)
    tags = Column(JSON, default=list)

    # Relationships
    owner = relationship("User", back_populates="documents")
    extraction = relationship("ExtractionResult", back_populates="document", uselist=False, cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="document", cascade="all, delete-orphan", order_by="AuditLog.created_at")


class ExtractionResult(Base):
    __tablename__ = "extraction_results"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), unique=True, nullable=False)

    # Extracted fields
    invoice_number = Column(String)
    company_name = Column(String)
    invoice_date = Column(String)
    total_amount = Column(Float)

    # Raw AI response
    raw_extraction = Column(JSON)

    # Human-corrected fields (stored separately)
    corrected_invoice_number = Column(String)
    corrected_company_name = Column(String)
    corrected_invoice_date = Column(String)
    corrected_total_amount = Column(Float)
    is_reviewed = Column(Boolean, default=False)

    confidence_score = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship
    document = relationship("Document", back_populates="extraction")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_name = Column(String, nullable=True)   # denormalized for display
    action = Column(String, nullable=False)       # uploaded, processing_started, etc.
    detail = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="audit_logs")
