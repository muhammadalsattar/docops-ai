from __future__ import annotations

import os
import uuid
from typing import Any

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from engine import DocOpsEngine, utc_now_iso
from models import (
    ApprovalDecisionRequest,
    ApprovalItem,
    AuditEventCreateRequest,
    AuditLogEntry,
    DocumentCreateRequest,
    DocumentRecord,
    RagQueryRequest,
    RagQueryResponse,
    ResponseEnvelope,
    UserRole,
)

app = FastAPI(
    title="DocOps AI Backend",
    version="1.0.0",
    description="Bilingual (EN/AR) Document RAG & Human-in-the-Loop Approval Ops API",
)

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3001,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = DocOpsEngine()

VALID_ROLES: set[str] = {"Admin", "Reviewer", "Viewer"}


def resolve_role(header_role: str | None) -> UserRole:
    if header_role in VALID_ROLES:
        return header_role  # type: ignore[return-value]
    return "Reviewer"


def envelope(request: Request, data: Any) -> dict[str, Any]:
    return {
        "request_id": getattr(request.state, "request_id", f"req-{uuid.uuid4().hex[:10]}"),
        "timestamp": utc_now_iso(),
        "data": data,
    }


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID") or f"req-{uuid.uuid4().hex[:10]}"
    request.state.request_id = req_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = req_id
    return response


@app.get("/health")
def health(request: Request) -> dict[str, Any]:
    return envelope(
        request,
        {
            "status": "ok",
            "service": "docops-ai-backend",
            "documents_indexed": len(engine.documents),
            "chunks_indexed": len(engine.chunks),
            "openai_configured": bool(os.getenv("OPENAI_API_KEY", "").strip()),
        },
    )


@app.get("/api/v1/documents", response_model=ResponseEnvelope[list[DocumentRecord]])
def list_documents(request: Request):
    return envelope(request, engine.documents)


@app.post("/api/v1/documents", response_model=ResponseEnvelope[DocumentRecord], status_code=201)
def create_document(
    payload: DocumentCreateRequest,
    request: Request,
    x_user_role: str | None = Header(default="Admin"),
):
    role = resolve_role(x_user_role)
    if role == "Viewer":
        engine.record_audit(
            request_id=request.state.request_id,
            actor_role=role,
            action="DOCUMENT_INGESTION_DENIED",
            resource=payload.title,
            status="denied",
            details="Viewer role is read-only and cannot ingest new documents.",
        )
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Viewer role has read-only access and cannot ingest documents.",
        )
    record = engine.ingest_document(payload, actor_role=role, request_id=request.state.request_id)
    return envelope(request, record)


@app.post("/api/v1/rag/query", response_model=ResponseEnvelope[RagQueryResponse])
def rag_query(
    payload: RagQueryRequest,
    request: Request,
    x_user_role: str | None = Header(default="Reviewer"),
):
    role = resolve_role(x_user_role)
    result = engine.query_rag(payload, actor_role=role, request_id=request.state.request_id)
    return envelope(request, result)


@app.get("/api/v1/approvals", response_model=ResponseEnvelope[list[ApprovalItem]])
def list_approvals(request: Request):
    return envelope(request, engine.approvals)


@app.post("/api/v1/approvals/{approval_id}/decision", response_model=ResponseEnvelope[ApprovalItem])
def approval_decision(
    approval_id: str,
    payload: ApprovalDecisionRequest,
    request: Request,
    x_user_role: str | None = Header(default="Viewer"),
):
    role = resolve_role(x_user_role)
    if role not in ("Admin", "Reviewer"):
        engine.record_audit(
            request_id=request.state.request_id,
            actor_role=role,
            action="APPROVAL_DECISION_DENIED",
            resource=approval_id,
            status="denied",
            details=f"RBAC blocked {payload.decision} attempt by {role} role.",
        )
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only Admin or Reviewer roles may submit approval decisions.",
        )

    try:
        updated = engine.decide_approval(
            approval_id=approval_id,
            decision=payload.decision,
            comment=payload.comment,
            actor_role=role,
            request_id=request.state.request_id,
        )
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Approval item '{approval_id}' not found.")

    return envelope(request, updated)


@app.get("/api/v1/audit-logs", response_model=ResponseEnvelope[list[AuditLogEntry]])
def list_audit_logs(request: Request):
    return envelope(request, engine.audit_logs)


@app.post("/api/v1/audit-logs", response_model=ResponseEnvelope[AuditLogEntry], status_code=201)
def create_audit_event(
    payload: AuditEventCreateRequest,
    request: Request,
    x_user_role: str | None = Header(default="Reviewer"),
):
    role = resolve_role(x_user_role)
    entry = engine.record_audit(
        request_id=request.state.request_id,
        actor_role=role,
        action=payload.action,
        resource=payload.resource,
        status="success",
        details=payload.details,
    )
    return envelope(request, entry)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    req_id = getattr(request.state, "request_id", f"req-{uuid.uuid4().hex[:10]}")
    return JSONResponse(
        status_code=exc.status_code,
        headers={"X-Request-ID": req_id},
        content={
            "request_id": req_id,
            "timestamp": utc_now_iso(),
            "error": exc.detail,
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8001")), reload=True)
