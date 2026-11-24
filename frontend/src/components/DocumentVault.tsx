"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  Lock,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import { getCopy } from "@/lib/i18n";
import type { DocLanguage, DocumentRecord, Locale, UserRole } from "@/lib/types";

interface DocumentVaultProps {
  locale: Locale;
  role: UserRole;
  documents: DocumentRecord[];
  onIngest: (payload: {
    title: string;
    category: string;
    language: DocLanguage;
    content: string;
  }) => Promise<void>;
  onSelectForRag: (docId: string) => void;
}

export default function DocumentVault({
  locale,
  role,
  documents,
  onIngest,
  onSelectForRag,
}: DocumentVaultProps) {
  const t = getCopy(locale);
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState<"ALL" | DocLanguage>("ALL");
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Commercial Contract");
  const [language, setLanguage] = useState<DocLanguage>("EN");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isViewer = role === "Viewer";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((doc) => {
      if (langFilter !== "ALL" && doc.language !== langFilter) return false;
      if (!q) return true;
      const haystack = [
        doc.title,
        doc.title_ar,
        doc.category,
        doc.category_ar,
        doc.summary,
        doc.summary_ar,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [documents, langFilter, search]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!title.trim()) {
      setTitle(file.name.replace(/\.(txt|md)$/i, ""));
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setContent(reader.result);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (title.trim().length < 2 || content.trim().length < 20) {
      setError(
        locale === "ar"
          ? "يرجى إدخال عنوان (حرفان على الأقل) ومحتوى (20 حرفاً على الأقل)."
          : "Please provide a title (min 2 chars) and content (min 20 chars)."
      );
      return;
    }
    setSubmitting(true);
    try {
      await onIngest({
        title: title.trim(),
        category: category.trim() || "Contract",
        language,
        content: content.trim(),
      });
      setTitle("");
      setContent("");
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ingest document");
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: DocumentRecord["status"]) => {
    if (status === "Indexed") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
          <CheckCircle2 className="h-3 w-3" />
          {status}
        </span>
      );
    }
    if (status === "Flagged") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-300">
          <AlertTriangle className="h-3 w-3" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
        <Clock className="h-3 w-3" />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            {t.vault.heading}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">{t.vault.subheading}</p>
        </div>

        <button
          type="button"
          disabled={isViewer}
          onClick={() => setModalOpen(true)}
          title={isViewer ? t.vault.readOnlyHint : undefined}
          className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
            isViewer
              ? "cursor-not-allowed border border-slate-800 bg-slate-900/60 text-slate-500"
              : "bg-indigo-600 text-white shadow-sm shadow-indigo-950/50 hover:bg-indigo-500"
          }`}
        >
          {isViewer ? <Lock className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {t.vault.ingestBtn}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800/80 bg-[#0f1623] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.vault.searchPlaceholder}
            className="w-full rounded-lg border border-slate-800 bg-[#090d16] py-2 pe-3 ps-9 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(["ALL", "EN", "AR", "Bilingual"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLangFilter(lang)}
              className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${
                langFilter === lang
                  ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40"
                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200"
              }`}
            >
              {lang === "ALL" ? t.vault.allLanguages : lang}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="group flex flex-col justify-between rounded-xl border border-slate-800/80 bg-[#0f1623] p-4 transition hover:border-slate-700"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/90 text-indigo-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      {locale === "ar" ? doc.title_ar : doc.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span>{locale === "ar" ? doc.category_ar : doc.category}</span>
                      <span className="text-slate-600">•</span>
                      <span className="rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">
                        {doc.language}
                      </span>
                    </div>
                  </div>
                </div>
                {statusBadge(doc.status)}
              </div>

              <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-400">
                {locale === "ar" ? doc.summary_ar : doc.summary}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 font-mono text-slate-300">
                  <Layers className="h-3.5 w-3.5 text-indigo-400" />
                  {doc.chunk_count} {t.vault.chunks}
                </span>
                <span>
                  {doc.page_count} {t.vault.pages}
                </span>
                <span className="hidden sm:inline">
                  {t.vault.uploadedBy}: <strong className="font-medium text-slate-300">{doc.uploaded_by}</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={() => onSelectForRag(doc.id)}
                className="rounded-md border border-slate-700/80 bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-indigo-300 transition hover:border-indigo-500/50 hover:bg-indigo-500/10"
              >
                {locale === "ar" ? "استعلام ←" : "Query →"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Ingest Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0f1623] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {t.vault.modalTitle}
                </h3>
                <p className="mt-1 text-xs text-slate-400">{t.vault.modalDesc}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  {t.vault.fieldTitle}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.vault.placeholderTitle}
                  className="w-full rounded-lg border border-slate-800 bg-[#090d16] px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    {t.vault.fieldCategory}
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-[#090d16] px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    {t.vault.fieldLanguage}
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as DocLanguage)}
                    className="w-full rounded-lg border border-slate-800 bg-[#090d16] px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  >
                    <option value="EN">EN</option>
                    <option value="AR">AR</option>
                    <option value="Bilingual">Bilingual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  {t.vault.fieldFile}
                </label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 bg-[#090d16] px-3 py-2.5 text-xs text-slate-400 transition hover:border-indigo-500/60 hover:text-slate-200">
                  <Upload className="h-3.5 w-3.5 text-indigo-400" />
                  <span>.txt / .md</span>
                  <input
                    type="file"
                    accept=".txt,.md,text/plain,text/markdown"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  {t.vault.fieldContent}
                </label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t.vault.placeholderContent}
                  className="w-full rounded-lg border border-slate-800 bg-[#090d16] p-3 text-xs leading-relaxed text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-800 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  {t.vault.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? t.vault.submitting : t.vault.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
