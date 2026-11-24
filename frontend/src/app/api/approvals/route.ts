import { NextRequest } from "next/server";
import { jsonEnvelope, tryProxyToFastApi } from "@/lib/api-proxy";
import { getEngine, makeRequestId } from "@/lib/rag-engine";

export async function GET(request: NextRequest) {
  const proxied = await tryProxyToFastApi(request, "/api/v1/approvals", "GET");
  if (proxied) return proxied;

  const engine = getEngine();
  return jsonEnvelope(engine.approvals, makeRequestId());
}
