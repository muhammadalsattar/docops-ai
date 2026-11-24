from __future__ import annotations

from typing import Any, Generic, Literal, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")

DocStatus = Literal["Indexed", "Processing", "Flagged"]
DocLanguage = Literal["EN", "AR", "Bilingual"]
UserRole = Literal["Admin", "Reviewer", "Viewer"]
ApprovalStatus = Literal["Pending", "Approved", "Revision Requested", "Escalated"]
ApprovalDecisionAction = Literal["approve", "request_revision", "escalate"]
RiskSeverity = Literal["High", "Medium", "Low"]


class ResponseEnvelope(BaseModel, Generic[T]):
    request_id: str
    timestamp: str
    data: T


class DocumentChunk(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    section: str
    page: int
    language: DocLanguage
    content: str


class DocumentRecord(BaseModel):
    id: str
    title: str
    title_ar: str
    category: str
    category_ar: str
    language: DocLanguage
    status: DocStatus
    chunk_count: int
    page_count: int
    uploaded_by: str
    updated_at: str
    summary: str
    summary_ar: str


class DocumentCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    category: str = Field(default="Contract", min_length=2, max_length=80)
    language: DocLanguage = "EN"
    content: str = Field(..., min_length=20)
    filename: Optional[str] = None


class RagQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=1000)
    language: Literal["en", "ar"] = "en"
    top_k: int = Field(default=4, ge=1, le=8)
    document_ids: Optional[list[str]] = None


class Citation(BaseModel):
    index: int
    chunk_id: str
    document_id: str
    document_title: str
    section: str
    page: int
    language: DocLanguage
    score: float
    excerpt: str


class RagQueryResponse(BaseModel):
    query: str
    answer: str
    mode: Literal["openai", "extractive"]
    latency_ms: int
    citations: list[Citation]


class ApprovalItem(BaseModel):
    id: str
    document_id: str
    document_title: str
    document_title_ar: str
    clause_ref: str
    clause_ref_ar: str
    risk_title: str
    risk_title_ar: str
    risk_summary: str
    risk_summary_ar: str
    source_excerpt: str
    severity: RiskSeverity
    confidence: float
    status: ApprovalStatus
    assigned_role: UserRole
    updated_at: str
    last_actor: Optional[str] = None
    last_comment: Optional[str] = None


class ApprovalDecisionRequest(BaseModel):
    decision: ApprovalDecisionAction
    comment: Optional[str] = Field(default=None, max_length=500)


class AuditLogEntry(BaseModel):
    id: str
    request_id: str
    timestamp: str
    actor_role: UserRole
    action: str
    resource: str
    status: Literal["success", "denied"]
    details: str


class AuditEventCreateRequest(BaseModel):
    action: str = Field(..., min_length=2, max_length=80)
    resource: str = Field(..., min_length=1, max_length=160)
    details: str = Field(..., min_length=1, max_length=500)
