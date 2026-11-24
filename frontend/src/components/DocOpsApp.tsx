"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  CheckSquare,
  FileStack,
  Globe,
  History,
  MessageSquareText,
  Scale,
  Server,
  Shield,
} from "lucide-react";
import { getCopy, getRoleLabel } from "@/lib/i18n";
import type {
  ApiEnvelope,
  ApprovalDecisionAction,
  ApprovalItem,
  AuditLogEntry,
  ChatTurn,
  DocLanguage,
  DocumentRecord,
  Locale,
  RagQueryResponse,
  UserRole,
} from "@/lib/types";
import ApprovalQueue from "./ApprovalQueue";
import AuditLogView from "./AuditLogView";
import DocumentVault from "./DocumentVault";
import RagWorkspace from "./RagWorkspace";

type TabKey = "vault" | "rag" | "approvals" | "audit";

export default function DocOpsApp() {
  const [locale, setLocale] = useState<Locale>("en");
  const [role, setRole] = useState<UserRole>("Reviewer");
  const [activeTab, setActiveTab] = useState<TabKey>("rag");
  const [runtime, setRuntime] = useState<"embedded" | "fastapi">("embedded");

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [scopedDocId, setScopedDocId] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  const t = getCopy(locale);

  const loadAll = useCallback(async () => {
    const [healthRes, docsRes, approvalsRes, auditRes] = await Promise.all([
      fetch("/api/health", { cache: "no-store" }),
      fetch("/api/documents", { cache: "no-store" }),
      fetch("/api/approvals", { cache: "no-store" }),
      fetch("/api/audit-logs", { cache: "no-store" }),
    ]);

    const runtimeHeader = healthRes.headers.get("x-docops-runtime");
    if (runtimeHeader === "fastapi" || runtimeHeader === "embedded") {
      setRuntime(runtimeHeader);
    }

    if (docsRes.ok) {
      const env = (await docsRes.json()) as ApiEnvelope<DocumentRecord[]>;
      setDocuments(env.data);
    }
    if (approvalsRes.ok) {
      const env = (await approvalsRes.json()) as ApiEnvelope<ApprovalItem[]>;
      setApprovals(env.data);
    }
    if (auditRes.ok) {
      const env = (await auditRes.json()) as ApiEnvelope<AuditLogEntry[]>;
      setAuditLogs(env.data);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
  }, [locale]);

  const handleRoleSwitch = async (nextRole: UserRole) => {
    if (nextRole === role) return;
    const prevRole = role;
    setRole(nextRole);
    await fetch("/api/audit-logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Role": nextRole,
      },
      body: JSON.stringify({
        action: "RBAC_ROLE_CHANGED",
        resource: `${prevRole} → ${nextRole}`,
        details: `Active operator switched RBAC session role from ${prevRole} to ${nextRole}.`,
      }),
    });
    const auditRes = await fetch("/api/audit-logs", { cache: "no-store" });
    if (auditRes.ok) {
      const env = (await auditRes.json()) as ApiEnvelope<AuditLogEntry[]>;
      setAuditLogs(env.data);
    }
  };

  const handleIngest = async (payload: {
    title: string;
    category: string;
    language: DocLanguage;
    content: string;
  }) => {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Role": role,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error || "Failed to ingest document");
    }
    await loadAll();
  };

  const handleAsk = async (query: string) => {
    setIsQuerying(true);
    try {
      const res = await fetch("/api/rag/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": role,
        },
        body: JSON.stringify({
          query,
          language: locale,
          top_k: 4,
          document_ids: scopedDocId ? [scopedDocId] : undefined,
        }),
      });
      if (!res.ok) return;
      const env = (await res.json()) as ApiEnvelope<RagQueryResponse>;
      const turn: ChatTurn = {
        id: env.request_id,
        requestId: env.request_id,
        query: env.data.query,
        answer: env.data.answer,
        mode: env.data.mode,
        latencyMs: env.data.latency_ms,
        citations: env.data.citations,
        timestamp: env.timestamp,
      };
      setTurns((prev) => [turn, ...prev]);

      const auditRes = await fetch("/api/audit-logs", { cache: "no-store" });
      if (auditRes.ok) {
        const auditEnv = (await auditRes.json()) as ApiEnvelope<AuditLogEntry[]>;
        setAuditLogs(auditEnv.data);
      }
    } finally {
      setIsQuerying(false);
    }
  };

  const handleDecision = async (
    id: string,
    decision: ApprovalDecisionAction,
    comment?: string
  ) => {
    const res = await fetch(`/api/approvals/${encodeURIComponent(id)}/decision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Role": role,
      },
      body: JSON.stringify({ decision, comment }),
    });
    if (res.ok) {
      await loadAll();
    }
  };

  const totalChunks = documents.reduce((sum, d) => sum + d.chunk_count, 0);
  const pendingCount = approvals.filter((a) => a.status === "Pending").length;

  const navItems: Array<{
    key: TabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { key: "rag", label: t.nav.rag, icon: MessageSquareText },
    { key: "vault", label: t.nav.vault, icon: FileStack, badge: documents.length },
    { key: "approvals", label: t.nav.approvals, icon: CheckSquare, badge: pendingCount },
    { key: "audit", label: t.nav.audit, icon: History, badge: auditLogs.length },
  ];

  return (
    <div
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[#090d16] text-slate-200"
    >
      {/* Top Enterprise Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-slate-950 shadow-lg shadow-indigo-950/50">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white">
                  {t.brand}
                </h1>
                <span className="hidden items-center gap-1 rounded-full border border-slate-800 bg-[#0f1623] px-2 py-0.5 font-mono text-[10px] text-emerald-400 sm:inline-flex">
                  <Server className="h-2.5 w-2.5" />
                  {runtime === "fastapi"
                    ? t.topbar.runtimeFastapi
                    : t.topbar.runtimeEmbedded}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{t.subtitle}</p>
            </div>
          </div>

          {/* Right Controls: RBAC Switcher + EN/AR RTL Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0f1623] p-1">
              <span className="hidden items-center gap-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 md:inline-flex">
                <Shield className="h-3 w-3 text-indigo-400" />
                {t.topbar.roleLabel}
              </span>
              {(["Admin", "Reviewer", "Viewer"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => void handleRoleSwitch(r)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                    role === r
                      ? r === "Viewer"
                        ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40"
                        : "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {getRoleLabel(locale, r)}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setLocale((prev) => (prev === "en" ? "ar" : "en"))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-[#0f1623] px-3 py-1.5 text-xs font-medium text-cyan-300 transition hover:border-cyan-500/50 hover:bg-cyan-500/10"
            >
              <Globe className="h-3.5 w-3.5" />
              {t.topbar.langToggle}
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* KPI Strip */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800/80 bg-[#0f1623] p-3.5">
            <p className="text-[11px] text-slate-400">{t.stats.indexedDocs}</p>
            <p className="mt-1 font-mono text-xl font-semibold text-white">
              {documents.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-[#0f1623] p-3.5">
            <p className="text-[11px] text-slate-400">{t.stats.totalChunks}</p>
            <p className="mt-1 font-mono text-xl font-semibold text-cyan-300">
              {totalChunks}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-[#0f1623] p-3.5">
            <p className="text-[11px] text-slate-400">{t.stats.pendingApprovals}</p>
            <p className="mt-1 font-mono text-xl font-semibold text-amber-300">
              {pendingCount}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-[#0f1623] p-3.5">
            <p className="text-[11px] text-slate-400">{t.stats.auditEvents}</p>
            <p className="mt-1 font-mono text-xl font-semibold text-indigo-300">
              {auditLogs.length}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-3">
          {navItems.map(({ key, label, icon: Icon, badge }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                  active
                    ? "bg-indigo-600/20 text-indigo-200 ring-1 ring-indigo-500/40"
                    : "text-slate-400 hover:bg-[#0f1623] hover:text-slate-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {typeof badge === "number" && (
                  <span className="rounded-full bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Active View */}
        <main>
          {activeTab === "vault" && (
            <DocumentVault
              locale={locale}
              role={role}
              documents={documents}
              onIngest={handleIngest}
              onSelectForRag={(docId) => {
                setScopedDocId(docId);
                setActiveTab("rag");
              }}
            />
          )}

          {activeTab === "rag" && (
            <RagWorkspace
              locale={locale}
              documents={documents}
              scopedDocId={scopedDocId}
              onClearScope={() => setScopedDocId(null)}
              turns={turns}
              onAsk={handleAsk}
              isQuerying={isQuerying}
            />
          )}

          {activeTab === "approvals" && (
            <ApprovalQueue
              locale={locale}
              role={role}
              approvals={approvals}
              onDecision={handleDecision}
            />
          )}

          {activeTab === "audit" && (
            <AuditLogView
              locale={locale}
              logs={auditLogs}
              onRefresh={loadAll}
            />
          )}
        </main>
      </div>
    </div>
  );
}
