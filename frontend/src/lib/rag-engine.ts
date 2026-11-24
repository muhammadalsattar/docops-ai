import { SEED_APPROVALS, SEED_AUDIT_LOGS, SEED_DOCUMENTS } from "./seed";
import type {
  ApprovalDecisionAction,
  ApprovalItem,
  ApprovalStatus,
  AuditLogEntry,
  Citation,
  DocLanguage,
  DocumentChunk,
  DocumentRecord,
  Locale,
  RagQueryResponse,
  UserRole,
} from "./types";

const ARABIC_DIACRITICS = /[\u0617-\u061A\u064B-\u0652\u0670]/g;
const TOKEN_PATTERN = /[a-zA-Z0-9\u0621-\u064A]{2,}/g;

const STOPWORDS = new Set([
  "the", "and", "for", "that", "with", "this", "from", "are", "was", "were",
  "have", "has", "had", "not", "but", "what", "which", "who", "when", "where",
  "how", "can", "will", "shall", "must", "may", "into", "about", "under", "over",
  "any", "all", "our", "your", "their", "its", "per", "upon", "within", "without",
  "في", "من", "على", "إلى", "الى", "عن", "مع", "هذا", "هذه", "التي", "الذي",
  "ما", "هو", "هي", "أو", "او", "أن", "ان", "كل", "بعد", "قبل", "خلال", "عند",
]);

const BILINGUAL_SYNONYMS: Record<string, string[]> = {
  breach: ["تسريب", "اختراق", "ابلاغ", "اخطار", "72"],
  تسريب: ["breach", "notification", "72", "incident"],
  residency: ["اقامه", "حدود", "نقل", "بيانات", "pdpl"],
  اقامه: ["residency", "cross-border", "pdpl", "data"],
  liability: ["مسؤوليه", "تعويض", "سقف", "indemnity", "cap"],
  مسؤوليه: ["liability", "indemnity", "cap", "uncapped"],
  sla: ["uptime", "availability", "99.95", "credit", "توافر"],
  uptime: ["sla", "availability", "99.95", "credit"],
  termination: ["انهاء", "export", "erasure", "30"],
  انهاء: ["termination", "export", "erasure", "notice"],
  subprocessor: ["sub-processor", "معالجين", "فرعيين", "10", "30"],
  معالجين: ["sub-processor", "notice", "dpa", "vendor"],
  training: ["تدريب", "zdr", "retention", "llm", "models"],
  تدريب: ["training", "zdr", "llm", "prohibition"],
  retention: ["احتفاظ", "حذف", "سنوات", "erasure"],
  احتفاظ: ["retention", "years", "audit", "deletion"],
  invoice: ["فواتير", "procurement", "approval", "50000", "ocr"],
  فواتير: ["invoice", "procurement", "approval", "ocr", "escalation"],
};

export function utcNowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function makeRequestId(): string {
  return `req-${Math.random().toString(16).slice(2, 10)}`;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
}

function tokenize(text: string, expandSynonyms = false): string[] {
  const norm = normalizeText(text);
  const raw = norm.match(TOKEN_PATTERN) ?? [];
  const tokens = raw.filter((tok) => !STOPWORDS.has(tok));
  if (expandSynonyms) {
    const extra: string[] = [];
    for (const tok of tokens) {
      if (BILINGUAL_SYNONYMS[tok]) {
        extra.push(...BILINGUAL_SYNONYMS[tok]);
      }
    }
    tokens.push(...extra);
  }
  return tokens;
}

function chunkText(text: string, maxChars = 420): string[] {
  const paragraphs = text
    .trim()
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  for (const para of paragraphs) {
    if (para.length <= maxChars) {
      chunks.push(para);
    } else {
      const sentences = para.split(/(?<=[.!?؟])\s+/);
      let buf = "";
      for (const sent of sentences) {
        if ((buf + " " + sent).trim().length <= maxChars) {
          buf = (buf + " " + sent).trim();
        } else {
          if (buf) chunks.push(buf);
          buf = sent;
        }
      }
      if (buf) chunks.push(buf);
    }
  }
  return chunks.length ? chunks : [text.trim().slice(0, maxChars)];
}

class InMemoryDocOpsEngine {
  documents: DocumentRecord[] = [];
  chunks: DocumentChunk[] = [];
  approvals: ApprovalItem[] = [];
  auditLogs: AuditLogEntry[] = [];
  private chunkTokens = new Map<string, string[]>();
  private idf = new Map<string, number>();

  constructor() {
    this.seed();
  }

  private seed() {
    for (const raw of SEED_DOCUMENTS) {
      raw.sections.forEach((sec, idx) => {
        this.chunks.push({
          chunk_id: `${raw.id}-c${idx + 1}`,
          document_id: raw.id,
          document_title: raw.title,
          section: sec.section,
          page: sec.page,
          language: raw.language,
          content: sec.content,
        });
      });

      this.documents.push({
        id: raw.id,
        title: raw.title,
        title_ar: raw.title_ar,
        category: raw.category,
        category_ar: raw.category_ar,
        language: raw.language,
        status: raw.status,
        chunk_count: raw.sections.length,
        page_count: raw.page_count,
        uploaded_by: raw.uploaded_by,
        updated_at: raw.updated_at,
        summary: raw.summary,
        summary_ar: raw.summary_ar,
      });
    }

    this.approvals = SEED_APPROVALS.map((item) => ({ ...item }));
    this.auditLogs = SEED_AUDIT_LOGS.map((item) => ({ ...item }));
    this.rebuildIndex();
  }

  private rebuildIndex() {
    this.chunkTokens.clear();
    const df = new Map<string, number>();

    for (const chunk of this.chunks) {
      const combined = `${chunk.document_title} ${chunk.section} ${chunk.content}`;
      const tokens = tokenize(combined, false);
      this.chunkTokens.set(chunk.chunk_id, tokens);
      const unique = new Set(tokens);
      unique.forEach((term) => {
        df.set(term, (df.get(term) ?? 0) + 1);
      });
    }

    const total = Math.max(this.chunks.length, 1);
    this.idf.clear();
    df.forEach((freq, term) => {
      this.idf.set(term, Math.log((total + 1) / (freq + 1)) + 1);
    });
  }

  recordAudit(
    requestId: string,
    actorRole: UserRole,
    action: string,
    resource: string,
    status: "success" | "denied",
    details: string
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `aud-${Math.random().toString(16).slice(2, 10)}`,
      request_id: requestId,
      timestamp: utcNowIso(),
      actor_role: actorRole,
      action,
      resource,
      status,
      details,
    };
    this.auditLogs.unshift(entry);
    return entry;
  }

  ingestDocument(
    input: {
      title: string;
      category: string;
      language: DocLanguage;
      content: string;
    },
    actorRole: UserRole,
    requestId: string
  ): DocumentRecord {
    const docId = `doc-${Math.random().toString(16).slice(2, 10)}`;
    const parts = chunkText(input.content);
    const riskTerms = [
      "uncapped",
      "indemnity",
      "penalty",
      "breach",
      "غير محدد",
      "غرامة",
      "تسريب",
    ];
    const lower = input.content.toLowerCase();
    const isFlagged = riskTerms.some((term) => lower.includes(term));

    parts.forEach((part, idx) => {
      this.chunks.push({
        chunk_id: `${docId}-c${idx + 1}`,
        document_id: docId,
        document_title: input.title,
        section: `Section ${idx + 1} · Ingested Excerpt`,
        page: idx + 1,
        language: input.language,
        content: part,
      });
    });

    const snippet = parts[0].length > 180 ? `${parts[0].slice(0, 180)}...` : parts[0];
    const record: DocumentRecord = {
      id: docId,
      title: input.title,
      title_ar: input.title,
      category: input.category || "Contract",
      category_ar: input.category || "عقد",
      language: input.language,
      status: isFlagged ? "Flagged" : "Indexed",
      chunk_count: parts.length,
      page_count: Math.max(1, parts.length),
      uploaded_by: actorRole,
      updated_at: utcNowIso(),
      summary: snippet,
      summary_ar: snippet,
    };

    this.documents.unshift(record);
    this.rebuildIndex();

    if (isFlagged) {
      this.approvals.unshift({
        id: `apr-${Math.random().toString(16).slice(2, 8)}`,
        document_id: docId,
        document_title: input.title,
        document_title_ar: input.title,
        clause_ref: "Section 1 · Page 1",
        clause_ref_ar: "القسم 1 · صفحة 1",
        risk_title: "Auto-flagged Clause Requiring Legal Review",
        risk_title_ar: "بند مُعلّم تلقائياً يتطلب مراجعة قانونية",
        risk_summary:
          "Ingestion scanner detected high-attention legal/compliance terms in the newly uploaded document.",
        risk_summary_ar:
          "رصد ماسح الاستيعاب مصطلحات قانونية أو امتثالية عالية الأهمية في المستند المرفوع حديثاً.",
        source_excerpt: parts[0].slice(0, 260),
        severity: "High",
        confidence: 0.89,
        status: "Pending",
        assigned_role: "Reviewer",
        updated_at: utcNowIso(),
        last_actor: null,
        last_comment: null,
      });
    }

    this.recordAudit(
      requestId,
      actorRole,
      "DOCUMENT_INGESTED",
      input.title,
      "success",
      `Indexed ${parts.length} chunks (${input.language}). Status: ${record.status}.`
    );

    return record;
  }

  queryRag(
    input: { query: string; language: Locale; top_k?: number; document_ids?: string[] },
    actorRole: UserRole,
    requestId: string
  ): RagQueryResponse {
    const start = Date.now();
    const topK = Math.min(Math.max(input.top_k ?? 4, 1), 8);
    const qTokens = tokenize(input.query, true);
    const qCounts = new Map<string, number>();
    qTokens.forEach((t) => qCounts.set(t, (qCounts.get(t) ?? 0) + 1));

    let qNormSq = 0;
    qCounts.forEach((cnt, t) => {
      const w = cnt * (this.idf.get(t) ?? 1);
      qNormSq += w * w;
    });
    const qNorm = Math.sqrt(qNormSq) || 1;

    const allowed = input.document_ids?.length ? new Set(input.document_ids) : null;
    const scored: Array<{ score: number; chunk: DocumentChunk }> = [];

    for (const chunk of this.chunks) {
      if (allowed && !allowed.has(chunk.document_id)) continue;
      const cTokens = this.chunkTokens.get(chunk.chunk_id) ?? [];
      if (!cTokens.length) continue;

      const cCounts = new Map<string, number>();
      cTokens.forEach((t) => cCounts.set(t, (cCounts.get(t) ?? 0) + 1));

      let cNormSq = 0;
      cCounts.forEach((cnt, t) => {
        const w = cnt * (this.idf.get(t) ?? 1);
        cNormSq += w * w;
      });
      const cNorm = Math.sqrt(cNormSq) || 1;

      let dot = 0;
      let overlap = 0;
      qCounts.forEach((qCnt, t) => {
        const cCnt = cCounts.get(t);
        if (cCnt) {
          const idf = this.idf.get(t) ?? 1;
          dot += qCnt * idf * (cCnt * idf);
          overlap += 1;
        }
      });

      if (dot > 0) {
        const cosine = dot / (qNorm * cNorm);
        const bonus = Math.min(0.18, overlap * 0.04);
        const score = Math.min(0.99, Math.round((cosine + bonus) * 1000) / 1000);
        scored.push({ score, chunk });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    let top = scored.slice(0, topK);

    if (!top.length && this.chunks.length) {
      const fallback = this.chunks.filter((c) => !allowed || allowed.has(c.document_id));
      top = fallback.slice(0, Math.min(2, topK)).map((chunk) => ({ score: 0.42, chunk }));
    }

    const citations: Citation[] = top.map(({ score, chunk }, idx) => ({
      index: idx + 1,
      chunk_id: chunk.chunk_id,
      document_id: chunk.document_id,
      document_title: chunk.document_title,
      section: chunk.section,
      page: chunk.page,
      language: chunk.language,
      score,
      excerpt: chunk.content,
    }));

    let answer: string;
    if (!citations.length) {
      answer =
        input.language === "ar"
          ? "لم يتم العثور على مقاطع مطابقة في خزنة المستندات الحالية."
          : "No matching passages were found in the indexed document vault.";
    } else if (input.language === "ar") {
      const bullets = citations.map(
        (c) => `- **${c.document_title} (${c.section})**: ${c.excerpt} [${c.index}]`
      );
      answer = [
        `بناءً على المقاطع المسترجعة من خزنة المستندات حول «${input.query}»، إليك الخلاصة الموثقة بالمصادر:`,
        ...bullets,
        "انقر على أي رقم مصدر مثل [1] أو [2] لمعاينة النص الأصلي ودرجة التطابق في لوحة فحص الأدلة.",
      ].join("\n\n");
    } else {
      const bullets = citations.map(
        (c) =>
          `- **${c.document_title} (${c.section}, p.${c.page})**: ${c.excerpt} [${c.index}]`
      );
      answer = [
        `Based on the retrieved policy and contract evidence for "${input.query}", here are the grounded findings:`,
        ...bullets,
        "Click any inline citation chip (e.g. [1], [2]) to inspect the exact source passage and similarity score.",
      ].join("\n\n");
    }

    const latencyMs = Math.max(18, Date.now() - start);
    this.recordAudit(
      requestId,
      actorRole,
      "RAG_QUERY",
      `top_k=${citations.length} · lang=${input.language.toUpperCase()}`,
      "success",
      `Query: "${input.query.slice(0, 120)}" (extractive, ${latencyMs}ms)`
    );

    return {
      query: input.query,
      answer,
      mode: "extractive",
      latency_ms: latencyMs,
      citations,
    };
  }

  decideApproval(
    approvalId: string,
    decision: ApprovalDecisionAction,
    comment: string | undefined,
    actorRole: UserRole,
    requestId: string
  ): ApprovalItem | null {
    const statusMap: Record<ApprovalDecisionAction, ApprovalStatus> = {
      approve: "Approved",
      request_revision: "Revision Requested",
      escalate: "Escalated",
    };

    const idx = this.approvals.findIndex((a) => a.id === approvalId);
    if (idx === -1) return null;

    const current = this.approvals[idx];
    const nextStatus = statusMap[decision];
    const updated: ApprovalItem = {
      ...current,
      status: nextStatus,
      updated_at: utcNowIso(),
      last_actor: actorRole,
      last_comment:
        comment?.trim() || `Actioned as ${nextStatus} by ${actorRole}.`,
    };
    this.approvals[idx] = updated;

    this.recordAudit(
      requestId,
      actorRole,
      "APPROVAL_DECISION",
      `${approvalId} · ${current.document_title}`,
      "success",
      `Decision: ${nextStatus}. ${updated.last_comment}`
    );

    return updated;
  }
}

const globalForEngine = globalThis as unknown as {
  __docopsEngine?: InMemoryDocOpsEngine;
};

export function getEngine(): InMemoryDocOpsEngine {
  if (!globalForEngine.__docopsEngine) {
    globalForEngine.__docopsEngine = new InMemoryDocOpsEngine();
  }
  return globalForEngine.__docopsEngine;
}
