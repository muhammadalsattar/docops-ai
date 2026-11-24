import { NextRequest } from "next/server";
import {
  errorEnvelope,
  jsonEnvelope,
  resolveRole,
  tryProxyToFastApi,
} from "@/lib/api-proxy";
import { getEngine, makeRequestId } from "@/lib/rag-engine";

export async function GET(request: NextRequest) {
  const proxied = await tryProxyToFastApi(request, "/api/v1/audit-logs", "GET");
  if (proxied) return proxied;

  const engine = getEngine();
  return jsonEnvelope(engine.auditLogs, makeRequestId());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const proxied = await tryProxyToFastApi(request, "/api/v1/audit-logs", "POST", body);
  if (proxied) return proxied;

  const requestId = request.headers.get("x-request-id") || makeRequestId();
  const role = resolveRole(request, "Reviewer");
  const action = String(body?.action ?? "").trim();
  const resource = String(body?.resource ?? "").trim();
  const details = String(body?.details ?? "").trim();

  if (!action || !resource || !details) {
    return errorEnvelope("Missing audit event fields.", requestId, 422);
  }

  const engine = getEngine();
  const entry = engine.recordAudit(requestId, role, action, resource, "success", details);
  return jsonEnvelope(entry, requestId, 201);
}
