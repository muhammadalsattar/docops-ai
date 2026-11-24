from __future__ import annotations

import math
import os
import re
import time
import uuid
from collections import Counter
from datetime import datetime, timezone
from typing import Optional

import httpx

from models import (
    ApprovalDecisionAction,
    ApprovalItem,
    ApprovalStatus,
    AuditLogEntry,
    Citation,
    DocumentChunk,
    DocumentCreateRequest,
    DocumentRecord,
    RagQueryRequest,
    RagQueryResponse,
    UserRole,
)
from seed_data import SEED_APPROVALS, SEED_DOCUMENTS

ARABIC_DIACRITICS = re.compile(r"[\u0617-\u061A\u064B-\u0652\u0670]")
TOKEN_PATTERN = re.compile(r"[a-zA-Z0-9\u0621-\u064A]{2,}")

STOPWORDS = {
    "the", "and", "for", "that", "with", "this", "from", "are", "was", "were",
    "have", "has", "had", "not", "but", "what", "which", "who", "when", "where",
    "how", "can", "will", "shall", "must", "may", "into", "about", "under", "over",
    "any", "all", "our", "your", "their", "its", "per", "upon", "within", "without",
    "في", "من", "على", "إلى", "الى", "عن", "مع", "هذا", "هذه", "التي", "الذي",
    "ما", "هو", "هي", "أو", "او", "أن", "ان", "كل", "بعد", "قبل", "خلال", "عند",
}

BILINGUAL_SYNONYMS: dict[str, list[str]] = {
    "breach": ["تسريب", "اختراق", "ابلاغ", "اخطار", "72"],
    "تسريب": ["breach", "notification", "72", "incident"],
    "residency": ["اقامه", "حدود", "نقل", "بيانات", "pdpl"],
    "اقامه": ["residency", "cross-border", "pdpl", "data"],
    "liability": ["مسؤوليه", "تعويض", "سقف", "indemnity", "cap"],
    "مسؤوليه": ["liability", "indemnity", "cap", "uncapped"],
    "sla": ["uptime", "availability", "99.95", "credit", "توافر"],
    "uptime": ["sla", "availability", "99.95", "credit"],
    "termination": ["انهاء", "export", "erasure", "30"],
    "انهاء": ["termination", "export", "erasure", "notice"],
    "subprocessor": ["sub-processor", "معالجين", "فرعيين", "10", "30"],
    "معالجين": ["sub-processor", "notice", "dpa", "vendor"],
    "training": ["تدريب", "zdr", "retention", "llm", "models"],
    "تدريب": ["training", "zdr", "llm", "prohibition"],
    "retention": ["احتفاظ", "حذف", "سنوات", "erasure"],
    "احتفاظ": ["retention", "years", "audit", "deletion"],
    "invoice": ["فواتير", "procurement", "approval", "50000", "ocr"],
    "فواتير": ["invoice", "procurement", "approval", "ocr", "escalation"],
}


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def normalize_text(text: str) -> str:
    text = text.lower()
    text = ARABIC_DIACRITICS.sub("", text)
    text = (
        text.replace("أ", "ا")
        .replace("إ", "ا")
        .replace("آ", "ا")
        .replace("ة", "ه")
        .replace("ى", "ي")
        .replace("ؤ", "و")
        .replace("ئ", "ي")
    )
    return text


def tokenize(text: str, expand_synonyms: bool = False) -> list[str]:
    norm = normalize_text(text)
    raw = TOKEN_PATTERN.findall(norm)
    tokens = [tok for tok in raw if tok not in STOPWORDS]
    if expand_synonyms:
        extra: list[str] = []
        for tok in tokens:
            if tok in BILINGUAL_SYNONYMS:
                extra.extend(BILINGUAL_SYNONYMS[tok])
        tokens.extend(extra)
    return tokens


def chunk_text(text: str, max_chars: int = 420) -> list[str]:
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n+", text.strip()) if p.strip()]
    chunks: list[str] = []
    for para in paragraphs:
        if len(para) <= max_chars:
            chunks.append(para)
        else:
            sentences = re.split(r"(?<=[.!?؟])\s+", para)
            buf = ""
            for sent in sentences:
                if len(buf) + len(sent) + 1 <= max_chars:
                    buf = f"{buf} {sent}".strip()
                else:
                    if buf:
                        chunks.append(buf)
                    buf = sent
            if buf:
                chunks.append(buf)
    return chunks or [text.strip()[:max_chars]]


class DocOpsEngine:
    def __init__(self) -> None:
        self.documents: list[DocumentRecord] = []
        self.chunks: list[DocumentChunk] = []
        self.approvals: list[ApprovalItem] = []
        self.audit_logs: list[AuditLogEntry] = []
        self._chunk_tokens: dict[str, list[str]] = {}
        self._idf: dict[str, float] = {}
        self._seed()

    def _seed(self) -> None:
        for raw_doc in SEED_DOCUMENTS:
            doc_chunks: list[DocumentChunk] = []
            for idx, sec in enumerate(raw_doc["sections"], start=1):
                chunk = DocumentChunk(
                    chunk_id=f"{raw_doc['id']}-c{idx}",
                    document_id=raw_doc["id"],
                    document_title=raw_doc["title"],
                    section=sec["section"],
                    page=sec["page"],
                    language=raw_doc["language"],
                    content=sec["content"],
                )
                doc_chunks.append(chunk)
                self.chunks.append(chunk)

            self.documents.append(
                DocumentRecord(
                    id=raw_doc["id"],
                    title=raw_doc["title"],
                    title_ar=raw_doc["title_ar"],
                    category=raw_doc["category"],
                    category_ar=raw_doc["category_ar"],
                    language=raw_doc["language"],
                    status=raw_doc["status"],
                    chunk_count=len(doc_chunks),
                    page_count=raw_doc["page_count"],
                    uploaded_by=raw_doc["uploaded_by"],
                    updated_at=raw_doc["updated_at"],
                    summary=raw_doc["summary"],
                    summary_ar=raw_doc["summary_ar"],
                )
            )

        self.approvals = [ApprovalItem(**item) for item in SEED_APPROVALS]
        self._rebuild_index()

        self.audit_logs = [
            AuditLogEntry(
                id="aud-001",
                request_id="req-seed-1001",
                timestamp="2026-11-23T08:30:12Z",
                actor_role="Admin",
                action="DOCUMENT_INDEXED",
                resource="Procurement & Invoice Approval SOP (MENA Ops)",
                status="success",
                details="Indexed 2 chunks (EN) into bilingual TF-IDF retrieval store.",
            ),
            AuditLogEntry(
                id="aud-002",
                request_id="req-seed-1002",
                timestamp="2026-11-23T10:12:04Z",
                actor_role="Reviewer",
                action="RISK_FLAG_EXTRACTED",
                resource="Enterprise Master Services Agreement (MSA v4.2)",
                status="success",
                details="AI clause scanner flagged Section 9.1(c) uncapped indemnity (High severity).",
            ),
            AuditLogEntry(
                id="aud-003",
                request_id="req-seed-1003",
                timestamp="2026-11-23T11:05:19Z",
                actor_role="Admin",
                action="APPROVAL_DECISION",
                resource="apr-103 · GCC Personal Data Protection & Residency Policy (PDPL)",
                status="success",
                details="Decision: Approved — Verified alignment with regional PDPL regulatory schedule.",
            ),
        ]

    def _rebuild_index(self) -> None:
        self._chunk_tokens = {}
        df: Counter[str] = Counter()
        for chunk in self.chunks:
            combined = f"{chunk.document_title} {chunk.section} {chunk.content}"
            tokens = tokenize(combined, expand_synonyms=False)
            self._chunk_tokens[chunk.chunk_id] = tokens
            for term in set(tokens):
                df[term] += 1

        total_docs = max(len(self.chunks), 1)
        self._idf = {
            term: math.log((total_docs + 1) / (freq + 1)) + 1.0
            for term, freq in df.items()
        }

    def record_audit(
        self,
        request_id: str,
        actor_role: UserRole,
        action: str,
        resource: str,
        status: str,
        details: str,
    ) -> AuditLogEntry:
        entry = AuditLogEntry(
            id=f"aud-{uuid.uuid4().hex[:8]}",
            request_id=request_id,
            timestamp=utc_now_iso(),
            actor_role=actor_role,
            action=action,
            resource=resource,
            status="denied" if status == "denied" else "success",
            details=details,
        )
        self.audit_logs.insert(0, entry)
        return entry

    def ingest_document(
        self,
        payload: DocumentCreateRequest,
        actor_role: UserRole,
        request_id: str,
    ) -> DocumentRecord:
        doc_id = f"doc-{uuid.uuid4().hex[:8]}"
        parts = chunk_text(payload.content)
        risk_terms = ["uncapped", "indemnity", "penalty", "breach", "غير محدد", "غرامة", "تسريب"]
        lower_content = payload.content.lower()
        is_flagged = any(term in lower_content for term in risk_terms)

        for idx, part in enumerate(parts, start=1):
            chunk = DocumentChunk(
                chunk_id=f"{doc_id}-c{idx}",
                document_id=doc_id,
                document_title=payload.title,
                section=f"Section {idx} · Ingested Excerpt",
                page=idx,
                language=payload.language,
                content=part,
            )
            self.chunks.append(chunk)

        summary_snippet = parts[0][:180] + ("..." if len(parts[0]) > 180 else "")
        record = DocumentRecord(
            id=doc_id,
            title=payload.title,
            title_ar=payload.title,
            category=payload.category,
            category_ar=payload.category,
            language=payload.language,
            status="Flagged" if is_flagged else "Indexed",
            chunk_count=len(parts),
            page_count=max(1, len(parts)),
            uploaded_by=actor_role,
            updated_at=utc_now_iso(),
            summary=summary_snippet,
            summary_ar=summary_snippet,
        )
        self.documents.insert(0, record)
        self._rebuild_index()

        if is_flagged:
            self.approvals.insert(
                0,
                ApprovalItem(
                    id=f"apr-{uuid.uuid4().hex[:6]}",
                    document_id=doc_id,
                    document_title=payload.title,
                    document_title_ar=payload.title,
                    clause_ref="Section 1 · Page 1",
                    clause_ref_ar="القسم 1 · صفحة 1",
                    risk_title="Auto-flagged Clause Requiring Legal Review",
                    risk_title_ar="بند مُعلّم تلقائياً يتطلب مراجعة قانونية",
                    risk_summary="Ingestion scanner detected high-attention legal/compliance terms in the newly uploaded document.",
                    risk_summary_ar="رصد ماسح الاستيعاب مصطلحات قانونية أو امتثالية عالية الأهمية في المستند المرفوع حديثاً.",
                    source_excerpt=parts[0][:260],
                    severity="High",
                    confidence=0.89,
                    status="Pending",
                    assigned_role="Reviewer",
                    updated_at=utc_now_iso(),
                ),
            )

        self.record_audit(
            request_id=request_id,
            actor_role=actor_role,
            action="DOCUMENT_INGESTED",
            resource=payload.title,
            status="success",
            details=f"Indexed {len(parts)} chunks ({payload.language}). Status: {record.status}.",
        )
        return record

    def retrieve(
        self,
        query: str,
        top_k: int = 4,
        document_ids: Optional[list[str]] = None,
    ) -> list[Citation]:
        q_tokens = tokenize(query, expand_synonyms=True)
        if not q_tokens:
            return []
        q_counts = Counter(q_tokens)
        q_norm = math.sqrt(sum((cnt * self._idf.get(t, 1.0)) ** 2 for t, cnt in q_counts.items())) or 1.0

        scored: list[tuple[float, DocumentChunk]] = []
        allowed_ids = set(document_ids) if document_ids else None

        for chunk in self.chunks:
            if allowed_ids is not None and chunk.document_id not in allowed_ids:
                continue
            c_tokens = self._chunk_tokens.get(chunk.chunk_id, [])
            if not c_tokens:
                continue
            c_counts = Counter(c_tokens)
            c_norm = math.sqrt(sum((cnt * self._idf.get(t, 1.0)) ** 2 for t, cnt in c_counts.items())) or 1.0

            dot = 0.0
            overlap = 0
            for term, q_cnt in q_counts.items():
                if term in c_counts:
                    idf = self._idf.get(term, 1.0)
                    dot += (q_cnt * idf) * (c_counts[term] * idf)
                    overlap += 1

            if dot > 0:
                cosine = dot / (q_norm * c_norm)
                overlap_bonus = min(0.18, overlap * 0.04)
                score = min(0.99, round(cosine + overlap_bonus, 3))
                scored.append((score, chunk))

        scored.sort(key=lambda pair: pair[0], reverse=True)
        top_items = scored[:top_k]

        if not top_items and self.chunks:
            fallback_pool = [c for c in self.chunks if not allowed_ids or c.document_id in allowed_ids]
            top_items = [(0.42, c) for c in fallback_pool[: min(2, top_k)]]

        citations: list[Citation] = []
        for idx, (score, chunk) in enumerate(top_items, start=1):
            citations.append(
                Citation(
                    index=idx,
                    chunk_id=chunk.chunk_id,
                    document_id=chunk.document_id,
                    document_title=chunk.document_title,
                    section=chunk.section,
                    page=chunk.page,
                    language=chunk.language,
                    score=score,
                    excerpt=chunk.content,
                )
            )
        return citations

    def _synthesize_extractive(self, query: str, language: str, citations: list[Citation]) -> str:
        if not citations:
            if language == "ar":
                return "لم يتم العثور على مقاطع مطابقة في خزنة المستندات الحالية. يرجى رفع مستند أو تجربة صياغة أخرى."
            return "No matching passages were found in the indexed document vault. Upload a document or refine your query."

        if language == "ar":
            lines = [
                f"بناءً على المقاطع المسترجعة من خزنة المستندات حول «{query}»، إليك الخلاصة الموثقة بالمصادر:"
            ]
            for c in citations:
                lines.append(f"- **[{c.index}] {c.document_title} ({c.section})**: {c.excerpt} [{c.index}]")
            lines.append("انقر على أي رقم مصدر مثل [1] أو [2] لمعاينة النص الأصلي ودرجة التطابق في لوحة فحص الأدلة.")
            return "\n\n".join(lines)

        lines = [
            f"Based on the retrieved policy and contract evidence for \"{query}\", here are the grounded findings:"
        ]
        for c in citations:
            lines.append(f"- **{c.document_title} ({c.section}, p.{c.page})**: {c.excerpt} [{c.index}]")
        lines.append("Click any inline citation chip (e.g. [1], [2]) to inspect the exact source passage and similarity score.")
        return "\n\n".join(lines)

    def _synthesize_openai(self, query: str, language: str, citations: list[Citation]) -> Optional[str]:
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key or not citations:
            return None

        context_block = "\n".join(
            f"[{c.index}] {c.document_title} | {c.section} (p.{c.page}): {c.excerpt}"
            for c in citations
        )
        lang_instruction = (
            "Respond concisely in formal Arabic using inline citations like [1], [2]."
            if language == "ar"
            else "Respond concisely in enterprise English using inline citations like [1], [2]."
        )

        try:
            with httpx.Client(timeout=12.0) as client:
                resp = client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                        "temperature": 0.1,
                        "messages": [
                            {
                                "role": "system",
                                "content": (
                                    "You are DocOps AI, a legal & compliance document RAG assistant. "
                                    f"Answer strictly from the provided sources. {lang_instruction}"
                                ),
                            },
                            {
                                "role": "user",
                                "content": f"Question: {query}\n\nSources:\n{context_block}",
                            },
                        ],
                    },
                )
                if resp.status_code == 200:
                    payload = resp.json()
                    return payload["choices"][0]["message"]["content"].strip()
        except Exception:
            return None
        return None

    def query_rag(
        self,
        payload: RagQueryRequest,
        actor_role: UserRole,
        request_id: str,
    ) -> RagQueryResponse:
        start = time.perf_counter()
        citations = self.retrieve(
            query=payload.query,
            top_k=payload.top_k,
            document_ids=payload.document_ids,
        )
        llm_answer = self._synthesize_openai(payload.query, payload.language, citations)
        if llm_answer:
            answer = llm_answer
            mode = "openai"
        else:
            answer = self._synthesize_extractive(payload.query, payload.language, citations)
            mode = "extractive"

        latency_ms = max(12, int((time.perf_counter() - start) * 1000))
        self.record_audit(
            request_id=request_id,
            actor_role=actor_role,
            action="RAG_QUERY",
            resource=f"top_k={len(citations)} · lang={payload.language.upper()}",
            status="success",
            details=f"Query: \"{payload.query[:120]}\" ({mode}, {latency_ms}ms)",
        )
        return RagQueryResponse(
            query=payload.query,
            answer=answer,
            mode=mode,
            latency_ms=latency_ms,
            citations=citations,
        )

    def decide_approval(
        self,
        approval_id: str,
        decision: ApprovalDecisionAction,
        comment: Optional[str],
        actor_role: UserRole,
        request_id: str,
    ) -> ApprovalItem:
        status_map: dict[ApprovalDecisionAction, ApprovalStatus] = {
            "approve": "Approved",
            "request_revision": "Revision Requested",
            "escalate": "Escalated",
        }
        for idx, item in enumerate(self.approvals):
            if item.id == approval_id:
                updated = item.model_copy(
                    update={
                        "status": status_map[decision],
                        "updated_at": utc_now_iso(),
                        "last_actor": actor_role,
                        "last_comment": comment or f"Actioned as {status_map[decision]} by {actor_role}.",
                    }
                )
                self.approvals[idx] = updated
                self.record_audit(
                    request_id=request_id,
                    actor_role=actor_role,
                    action="APPROVAL_DECISION",
                    resource=f"{approval_id} · {item.document_title}",
                    status="success",
                    details=f"Decision: {status_map[decision]}. {updated.last_comment}",
                )
                return updated
        raise KeyError(approval_id)
