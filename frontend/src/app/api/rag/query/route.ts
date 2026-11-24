import { NextRequest } from "next/server";
import {
  errorEnvelope,
  jsonEnvelope,
  resolveRole,
  tryProxyToFastApi,
} from "@/lib/api-proxy";
import { getEngine, makeRequestId } from "@/lib/rag-engine";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const proxied = await tryProxyToFastApi(request, "/api/v1/rag/query", "POST", body);
  if (proxied) return proxied;

  const requestId = request.headers.get("x-request-id") || makeRequestId();
  const role = resolveRole(request, "Reviewer");
  const query = String(body?.query ?? "").trim();

  if (query.length < 2) {
    return errorEnvelope("Validation error: query must be at least 2 characters.", requestId, 422);
  }

  const engine = getEngine();
  const result = engine.queryRag(
    {
      query,
      language: body?.language === "ar" ? "ar" : "en",
      top_k: typeof body?.top_k === "number" ? body.top_k : 4,
      document_ids: Array.isArray(body?.document_ids) ? body.document_ids : undefined,
    },
    role,
    requestId
  );

  return jsonEnvelope(result, requestId);
}
