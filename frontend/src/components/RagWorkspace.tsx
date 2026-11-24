"use client";

import React, { useEffect, useState } from "react";
import {
  BookOpen,
  FileSearch,
  Send,
  Sparkles,
  Zap,
  X,
} from "lucide-react";
import { getCopy } from "@/lib/i18n";
import type { ChatTurn, Citation, DocumentRecord, Locale } from "@/lib/types";

interface RagWorkspaceProps {
  locale: Locale;
  documents: DocumentRecord[];
  scopedDocId: string | null;
  onClearScope: () => void;
  turns: ChatTurn[];
  onAsk: (query: string) => Promise<void>;
  isQuerying: boolean;
}

function CitationRichText({
  text,
  citations,
  selectedChunkId,
  onSelectCitation,
}: {
  text: string;
  citations: Citation[];
  selectedChunkId: string | null;
  onSelectCitation: (c: Citation) => void;
}) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <div className="space-y-2.5 text-xs leading-relaxed text-slate-200">
      {text.split("\n\n").map((paragraph, pIdx) => {
        const tokens = paragraph.split(/(\[\d+\]|\*\*[^*]+\*\*)/g);
        return (
          <p key={pIdx}>
            {tokens.map((tok, tIdx) => {
              const citeMatch = tok.match(/^\[(\d+)\]$/);
              if (citeMatch) {
                const idx = Number(citeMatch[1]);
                const found = citations.find((c) => c.index === idx);
                if (!found) return <span key={tIdx}>{tok}</span>;
                const active = selectedChunkId === found.chunk_id;
                return (
                  <button
                    key={tIdx}
                    type="button"
                    onClick={() => onSelectCitation(found)}
                    className={`mx-0.5 inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold transition ${
                      active
                        ? "bg-cyan-400 text-slate-950 ring-2 ring-cyan-300/60"
                        : "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/35"
                    }`}
                  >
                    [{idx}]
                  </button>
                );
              }
              const boldMatch = tok.match(/^\*\*(.+)\*\*$/);
              if (boldMatch) {
                return (
                  <strong key={tIdx} className="font-semibold text-white">
                    {boldMatch[1]}
                  </strong>
                );
              }
              return <React.Fragment key={tIdx}>{tok}</React.Fragment>;
            })}
          </p>
        );
      })}
      {parts.length === 0 && null}
    </div>
  );
}

export default function RagWorkspace({
  locale,
  documents,
  scopedDocId,
  onClearScope,
  turns,
  onAsk,
  isQuerying,
}: RagWorkspaceProps) {
  const t = getCopy(locale);
  const [input, setInput] = useState("");
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [streamRevealLen, setStreamRevealLen] = useState<number>(99999);

  const latestTurn = turns[0] ?? null;

  // Smooth streaming-style reveal for the newest answer
  useEffect(() => {
    if (!latestTurn) return;
    setStreamRevealLen(0);
    if (latestTurn.citations.length > 0) {
      setSelectedCitation(latestTurn.citations[0]);
    }
    const total = latestTurn.answer.length;
    const step = Math.max(18, Math.ceil(total / 26));
    const timer = window.setInterval(() => {
      setStreamRevealLen((prev) => {
        if (prev + step >= total) {
          window.clearInterval(timer);
          return total;
        }
        return prev + step;
      });
    }, 18);
    return () => window.clearInterval(timer);
  }, [latestTurn?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const scopedDoc = scopedDocId
    ? documents.find((d) => d.id === scopedDocId)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || isQuerying) return;
    setInput("");
    await onAsk(q);
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
      {/* Main Q&A Column */}
      <div className="space-y-4 xl:col-span-8">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            {t.rag.heading}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">{t.rag.subheading}</p>
        </div>

        {/* Query Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-800/90 bg-[#0f1623] p-3.5 shadow-sm"
        >
          {scopedDoc && (
            <div className="mb-2.5 flex items-center justify-between rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-[11px] text-indigo-200">
              <span>
                {locale === "ar" ? "نطاق البحث:" : "Scoped to:"}{" "}
                <strong>{locale === "ar" ? scopedDoc.title_ar : scopedDoc.title}</strong>
              </span>
              <button
                type="button"
                onClick={onClearScope}
                className="inline-flex items-center gap-1 text-indigo-300 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
                {t.rag.clearScope}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.rag.inputPlaceholder}
              className="flex-1 rounded-lg border border-slate-800 bg-[#090d16] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isQuerying || input.trim().length < 2}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {isQuerying ? t.rag.asking : t.rag.askBtn}
            </button>
          </div>

          {/* Suggested Bilingual Prompts */}
          <div className="mt-3">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
              {t.rag.suggestedTitle}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {t.rag.prompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isQuerying}
                  onClick={() => onAsk(prompt)}
                  className="rounded-md border border-slate-800 bg-[#090d16] px-2.5 py-1.5 text-start text-[11px] text-slate-300 transition hover:border-indigo-500/40 hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Answer Stream */}
        <div className="space-y-4">
          {turns.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-[#0f1623]/60 px-6 py-12 text-center">
              <Sparkles className="h-7 w-7 text-indigo-400" />
              <p className="mt-3 text-sm font-medium text-slate-200">
                {locale === "ar"
                  ? "ابدأ بسؤال بالعربية أو الإنجليزية لاسترجاع الأدلة الموثقة"
                  : "Ask a question in English or Arabic to run citation-grounded retrieval"}
              </p>
              <p className="mt-1 max-w-md text-xs text-slate-500">
                {t.rag.subheading}
              </p>
            </div>
          ) : (
            turns.map((turn, idx) => {
              const displayedAnswer =
                idx === 0 ? turn.answer.slice(0, streamRevealLen) : turn.answer;
              return (
                <div
                  key={turn.id}
                  className="rounded-xl border border-slate-800/80 bg-[#0f1623] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <p className="text-xs font-semibold text-white">{turn.query}</p>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                      <span className="inline-flex items-center gap-1 rounded bg-slate-900 px-2 py-0.5 text-cyan-300">
                        <Zap className="h-3 w-3" />
                        {turn.mode === "openai"
                          ? t.rag.modeOpenai
                          : t.rag.modeExtractive}
                      </span>
                      <span>{turn.latencyMs}ms</span>
                      <span className="text-slate-500">{turn.requestId}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <CitationRichText
                      text={displayedAnswer}
                      citations={turn.citations}
                      selectedChunkId={selectedCitation?.chunk_id ?? null}
                      onSelectCitation={setSelectedCitation}
                    />
                  </div>

                  {turn.citations.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800/70 pt-3">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                        {t.rag.citationsCount} ({turn.citations.length}):
                      </span>
                      {turn.citations.map((c) => {
                        const isSelected = selectedCitation?.chunk_id === c.chunk_id;
                        return (
                          <button
                            key={c.chunk_id}
                            type="button"
                            onClick={() => setSelectedCitation(c)}
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition ${
                              isSelected
                                ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-200"
                                : "border-slate-800 bg-[#090d16] text-slate-300 hover:border-indigo-500/40"
                            }`}
                          >
                            <span className="font-mono font-semibold text-indigo-400">
                              [{c.index}]
                            </span>
                            <span className="max-w-[180px] truncate">
                              {c.document_title}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-400">
                              {Math.round(c.score * 100)}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Evidence Inspector Drawer */}
      <aside className="xl:col-span-4">
        <div className="sticky top-20 rounded-xl border border-slate-800/90 bg-[#0f1623] p-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <FileSearch className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">
              {t.rag.inspectorTitle}
            </h3>
          </div>

          {!selectedCitation ? (
            <div className="py-10 text-center">
              <BookOpen className="mx-auto h-7 w-7 text-slate-600" />
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                {t.rag.inspectorEmpty}
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center rounded-md bg-cyan-500/15 px-2.5 py-1 font-mono text-xs font-semibold text-cyan-300 ring-1 ring-cyan-500/30">
                  Citation [{selectedCitation.index}]
                </span>
                <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                  {selectedCitation.language}
                </span>
              </div>

              {/* Similarity Score Bar */}
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{t.rag.similarity}</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {(selectedCitation.score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all"
                    style={{ width: `${Math.min(100, selectedCitation.score * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-slate-800/80 bg-[#090d16] p-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">
                    {t.rag.sourceDoc}
                  </span>
                  <p className="mt-0.5 font-medium text-slate-100">
                    {selectedCitation.document_title}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-2">
                  <div className="col-span-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">
                      {t.rag.section}
                    </span>
                    <p className="mt-0.5 text-[11px] text-slate-300">
                      {selectedCitation.section}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">
                      {t.rag.page}
                    </span>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-300">
                      p.{selectedCitation.page}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  {locale === "ar" ? "النص المصدر المقتبس" : "Highlighted Source Passage"}
                </span>
                <blockquote className="mt-1.5 rounded-lg border-s-2 border-cyan-400 bg-cyan-500/5 p-3 text-xs leading-relaxed text-slate-200">
                  {selectedCitation.excerpt}
                </blockquote>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
