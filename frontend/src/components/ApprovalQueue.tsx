"use client";

import React, { useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Lock,
  MessageSquareWarning,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { getCopy } from "@/lib/i18n";
import type {
  ApprovalDecisionAction,
  ApprovalItem,
  Locale,
  UserRole,
} from "@/lib/types";

interface ApprovalQueueProps {
  locale: Locale;
  role: UserRole;
  approvals: ApprovalItem[];
  onDecision: (
    id: string,
    decision: ApprovalDecisionAction,
    comment?: string
  ) => Promise<void>;
}

export default function ApprovalQueue({
  locale,
  role,
  approvals,
  onDecision,
}: ApprovalQueueProps) {
  const t = getCopy(locale);
  const isViewer = role === "Viewer";
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleAction = async (id: string, action: ApprovalDecisionAction) => {
    if (isViewer || busyId) return;
    setBusyId(id);
    try {
      await onDecision(id, action, notes[id]?.trim() || undefined);
      setNotes((prev) => ({ ...prev, [id]: "" }));
    } finally {
      setBusyId(null);
    }
  };

  const severityBadge = (severity: ApprovalItem["severity"]) => {
    if (severity === "High") {
      return "border-rose-500/35 bg-rose-500/10 text-rose-300";
    }
    if (severity === "Medium") {
      return "border-amber-500/35 bg-amber-500/10 text-amber-300";
    }
    return "border-emerald-500/35 bg-emerald-500/10 text-emerald-300";
  };

  const statusBadge = (status: ApprovalItem["status"]) => {
    switch (status) {
      case "Approved":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
      case "Revision Requested":
        return "border-amber-500/30 bg-amber-500/10 text-amber-300";
      case "Escalated":
        return "border-rose-500/30 bg-rose-500/10 text-rose-300";
      default:
        return "border-indigo-500/30 bg-indigo-500/10 text-indigo-300";
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">
          {t.approvals.heading}
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">{t.approvals.subheading}</p>
      </div>

      {isViewer && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          <Lock className="h-4 w-4 shrink-0 text-amber-400" />
          <span>{t.approvals.viewerBanner}</span>
        </div>
      )}

      <div className="space-y-4">
        {approvals.map((item) => {
          const isBusy = busyId === item.id;
          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800/80 bg-[#0f1623] p-4 transition hover:border-slate-700"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${severityBadge(
                        item.severity
                      )}`}
                    >
                      {item.severity === "High" ? (
                        <AlertOctagon className="h-3 w-3" />
                      ) : item.severity === "Medium" ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <ShieldCheck className="h-3 w-3" />
                      )}
                      {item.severity} Risk
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusBadge(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {t.approvals.confidence}: {Math.round(item.confidence * 100)}%
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white">
                    {locale === "ar" ? item.risk_title_ar : item.risk_title}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {locale === "ar" ? item.document_title_ar : item.document_title}{" "}
                    <span className="text-slate-600">•</span>{" "}
                    <span className="text-cyan-300">
                      {locale === "ar" ? item.clause_ref_ar : item.clause_ref}
                    </span>
                  </p>
                </div>

                <span className="font-mono text-[10px] text-slate-500">
                  {item.id}
                </span>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-300">
                {locale === "ar" ? item.risk_summary_ar : item.risk_summary}
              </p>

              <div className="mt-3 rounded-lg border border-slate-800 bg-[#090d16] p-3">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  {t.approvals.sourceExcerpt}
                </span>
                <p className="mt-1 text-xs italic leading-relaxed text-slate-300">
                  “{item.source_excerpt}”
                </p>
              </div>

              {item.last_actor && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span className="font-medium text-slate-300">
                    {t.approvals.lastAction}:
                  </span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-indigo-300">
                    {item.last_actor}
                  </span>
                  {item.last_comment && <span>— {item.last_comment}</span>}
                </div>
              )}

              {/* Action Controls */}
              <div className="mt-4 flex flex-col gap-2.5 border-t border-slate-800/80 pt-3.5 sm:flex-row sm:items-center">
                <input
                  type="text"
                  disabled={isViewer || isBusy}
                  value={notes[item.id] ?? ""}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                  }
                  placeholder={t.approvals.notePlaceholder}
                  className="flex-1 rounded-lg border border-slate-800 bg-[#090d16] px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isViewer || isBusy}
                    onClick={() => handleAction(item.id, "approve")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t.approvals.approve}
                  </button>
                  <button
                    type="button"
                    disabled={isViewer || isBusy}
                    onClick={() => handleAction(item.id, "request_revision")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-300 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <MessageSquareWarning className="h-3.5 w-3.5" />
                    {t.approvals.requestRevision}
                  </button>
                  <button
                    type="button"
                    disabled={isViewer || isBusy}
                    onClick={() => handleAction(item.id, "escalate")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {t.approvals.escalate}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
