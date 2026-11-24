import { NextRequest } from "next/server";
import {
  errorEnvelope,
  jsonEnvelope,
  resolveRole,
  tryProxyToFastApi,
} from "@/lib/api-proxy";
import { getEngine, makeRequestId } from "@/lib/rag-engine";
import type { DocLanguage } from "@/lib/types";

export async function GET(request: NextRequest) {
  const proxied = await tryProxyToFastApi(request, "/api/v1/documents", "GET");
  if (proxied) return proxied;

  const engine = getEngine();
  return jsonEnvelope(engine.documents, makeRequestId());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const proxied = await tryProxyToFastApi(request, "/api/v1/documents", "POST", body);
  if (proxied) return proxied;

  const requestId = request.headers.get("x-request-id") || makeRequestId();
  const role = resolveRole(request, "Admin");
  const engine = getEngine();

  if (role === "Viewer") {
    engine.recordAudit(
      requestId,
      role,
      "DOCUMENT_INGESTION_DENIED",
      String(body?.title || "Untitled"),
      "denied",
      "Viewer role is read-only and cannot ingest new documents."
    );
    return errorEnvelope(
      "Forbidden: Viewer role has read-only access and cannot ingest documents.",
      requestId,
      403
    );
  }

  const title = String(body?.title ?? "").trim();
  const content = String(body?.content ?? "").trim();
  const category = String(body?.category ?? "Contract").trim();
  const language: DocLanguage =
    body?.language === "AR" || body?.language === "Bilingual" ? body.language : "EN";

  if (title.length < 2 || content.length < 20) {
    return errorEnvelope(
      "Validation error: title (min 2 chars) and content (min 20 chars) are required.",
      requestId,
      422
    );
  }

  const record = engine.ingestDocument(
    { title, category, language, content },
    role,
    requestId
  );
  return jsonEnvelope(record, requestId, 201);
}
