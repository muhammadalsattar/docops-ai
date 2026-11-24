"use client";

import React, { useMemo, useState } from "react";
import { RefreshCw, ShieldCheck, ShieldX } from "lucide-react";
import { getCopy } from "@/lib/i18n";
import type { AuditLogEntry, Locale } from "@/lib/types";

interface AuditLogViewProps {
  locale: Locale;
  logs: AuditLogEntry[];
  onRefresh: () => Promise<void>;
}

export default function AuditLogView({
  locale,
  logs,
  onRefresh,
}: AuditLogViewProps) {
  const t = getCopy(locale);
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.action)));
  }, [logs]);

  const filtered = useMemo(() => {
    if (actionFilter === "ALL") return logs;
    return logs.filter((l) => l.action === actionFilter);
  }, [actionFilter, logs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            {t.audit.heading}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">{t.audit.subheading}</p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0f1623] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {t.audit.refresh}
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActionFilter("ALL")}
          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
            actionFilter === "ALL"
              ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40"
              : "bg-[#0f1623] text-slate-400 hover:text-slate-200"
          }`}
        >
          {t.audit.filterAll} ({logs.length})
        </button>
        {uniqueActions.map((act) => (
          <button
            key={act}
            type="button"
            onClick={() => setActionFilter(act)}
            className={`rounded-md px-2.5 py-1 font-mono text-[10px] font-medium transition ${
              actionFilter === act
                ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40"
                : "bg-[#0f1623] text-slate-400 hover:text-slate-200"
            }`}
          >
            {act}
          </button>
        ))}
      </div>

      {/* Log Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#0f1623]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-start text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0b101b] text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 text-start">{t.audit.colTime}</th>
                <th className="px-4 py-3 text-start">{t.audit.colReqId}</th>
                <th className="px-4 py-3 text-start">{t.audit.colRole}</th>
                <th className="px-4 py-3 text-start">{t.audit.colAction}</th>
                <th className="px-4 py-3 text-start">{t.audit.colStatus}</th>
                <th className="px-4 py-3 text-start">{t.audit.colDetails}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-900/50">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-slate-400">
                    {entry.timestamp.replace("T", " ").replace("Z", "")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-cyan-300">
                    {entry.request_id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-200">
                      {entry.actor_role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] font-semibold text-indigo-300">
                    {entry.action}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {entry.status === "success" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                        <ShieldCheck className="h-3 w-3" />
                        success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-300">
                        <ShieldX className="h-3 w-3" />
                        denied
                      </span>
                    )}
                  </td>
                  <td className="max-w-md px-4 py-3 text-[11px] text-slate-300">
                    <div className="font-medium text-slate-200">{entry.resource}</div>
                    <div className="mt-0.5 text-slate-400">{entry.details}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
