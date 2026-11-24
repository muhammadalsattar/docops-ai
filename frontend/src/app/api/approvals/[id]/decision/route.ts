import { NextRequest } from "next/server";
import {
  errorEnvelope,
  jsonEnvelope,
  resolveRole,
  tryProxyToFastApi,
} from "@/lib/api-proxy";
import { getEngine, makeRequestId } from "@/lib/rag-engine";
import type { ApprovalDecisionAction } from "@/lib/types";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();
  const proxied = await tryProxyToFastApi(
    request,
    `/api/v1/approvals/${encodeURIComponent(id)}/decision`,
    "POST",
    body
  );
  if (proxied) return proxied;

  const requestId = request.headers.get("x-request-id") || makeRequestId();
  const role = resolveRole(request, "Viewer");
  const engine = getEngine();
  const decision = body?.decision as ApprovalDecisionAction;

  if (!["approve", "request_revision", "escalate"].includes(decision)) {
    return errorEnvelope("Invalid decision action.", requestId, 422);
  }

  if (role === "Viewer") {
    engine.recordAudit(
      requestId,
      role,
      "APPROVAL_DECISION_DENIED",
      id,
      "denied",
      `RBAC blocked ${decision} attempt by Viewer role.`
    );
    return errorEnvelope(
      "Forbidden: Only Admin or Reviewer roles may submit approval decisions.",
      requestId,
      403
    );
  }

  const updated = engine.decideApproval(
    id,
    decision,
    typeof body?.comment === "string" ? body.comment : undefined,
    role,
    requestId
  );

  if (!updated) {
    return errorEnvelope(`Approval item '${id}' not found.`, requestId, 404);
  }

  return jsonEnvelope(updated, requestId);
}
