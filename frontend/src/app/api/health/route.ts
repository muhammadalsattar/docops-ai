import { NextRequest } from "next/server";
import { jsonEnvelope, tryProxyToFastApi } from "@/lib/api-proxy";
import { getEngine, makeRequestId } from "@/lib/rag-engine";

export async function GET(request: NextRequest) {
  const proxied = await tryProxyToFastApi(request, "/health", "GET");
  if (proxied) return proxied;

  const engine = getEngine();
  return jsonEnvelope(
    {
      status: "ok",
      service: "docops-ai-embedded",
      documents_indexed: engine.documents.length,
      chunks_indexed: engine.chunks.length,
      openai_configured: false,
    },
    makeRequestId(),
    200,
    "embedded"
  );
}
