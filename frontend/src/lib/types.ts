export type Locale = "en" | "ar";
export type DocStatus = "Indexed" | "Processing" | "Flagged";
export type DocLanguage = "EN" | "AR" | "Bilingual";
export type UserRole = "Admin" | "Reviewer" | "Viewer";
export type ApprovalStatus =
  | "Pending"
  | "Approved"
  | "Revision Requested"
  | "Escalated";
export type ApprovalDecisionAction = "approve" | "request_revision" | "escalate";
export type RiskSeverity = "High" | "Medium" | "Low";

export interface ApiEnvelope<T> {
  request_id: string;
  timestamp: string;
  data: T;
  error?: string;
}

export interface DocumentChunk {
  chunk_id: string;
  document_id: string;
  document_title: string;
  section: string;
  page: number;
  language: DocLanguage;
  content: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  title_ar: string;
  category: string;
  category_ar: string;
  language: DocLanguage;
  status: DocStatus;
  chunk_count: number;
  page_count: number;
  uploaded_by: string;
  updated_at: string;
  summary: string;
  summary_ar: string;
}

export interface Citation {
  index: number;
  chunk_id: string;
  document_id: string;
  document_title: string;
  section: string;
  page: number;
  language: DocLanguage;
  score: number;
  excerpt: string;
}

export interface RagQueryResponse {
  query: string;
  answer: string;
  mode: "openai" | "extractive";
  latency_ms: number;
  citations: Citation[];
}

export interface ApprovalItem {
  id: string;
  document_id: string;
  document_title: string;
  document_title_ar: string;
  clause_ref: string;
  clause_ref_ar: string;
  risk_title: string;
  risk_title_ar: string;
  risk_summary: string;
  risk_summary_ar: string;
  source_excerpt: string;
  severity: RiskSeverity;
  confidence: number;
  status: ApprovalStatus;
  assigned_role: UserRole;
  updated_at: string;
  last_actor?: string | null;
  last_comment?: string | null;
}

export interface AuditLogEntry {
  id: string;
  request_id: string;
  timestamp: string;
  actor_role: UserRole;
  action: string;
  resource: string;
  status: "success" | "denied";
  details: string;
}

export interface ChatTurn {
  id: string;
  requestId: string;
  query: string;
  answer: string;
  mode: "openai" | "extractive";
  latencyMs: number;
  citations: Citation[];
  timestamp: string;
}
