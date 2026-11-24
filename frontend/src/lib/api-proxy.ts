import { NextRequest, NextResponse } from "next/server";
import { makeRequestId, utcNowIso } from "./rag-engine";
import type { UserRole } from "./types";

const VALID_ROLES = new Set<UserRole>(["Admin", "Reviewer", "Viewer"]);

export function resolveRole(request: NextRequest, fallback: UserRole = "Reviewer"): UserRole {
  const raw = request.headers.get("x-user-role") as UserRole | null;
  if (raw && VALID_ROLES.has(raw)) {
    return raw;
  }
  return fallback;
}

export function getFastApiBaseUrl(): string | null {
  const url = process.env.FASTAPI_URL?.trim();
  if (!url) return null;
  return url.replace(/\/+$/, "");
}

export function jsonEnvelope<T>(
  data: T,
  requestId: string,
  status = 200,
  runtime: "embedded" | "fastapi" = "embedded"
) {
  return NextResponse.json(
    {
      request_id: requestId,
      timestamp: utcNowIso(),
      data,
    },
    {
      status,
      headers: {
        "X-Request-ID": requestId,
        "X-DocOps-Runtime": runtime,
      },
    }
  );
}

export function errorEnvelope(error: string, requestId: string, status: number) {
  return NextResponse.json(
    {
      request_id: requestId,
      timestamp: utcNowIso(),
      error,
    },
    {
      status,
      headers: {
        "X-Request-ID": requestId,
      },
    }
  );
}

export async function tryProxyToFastApi(
  request: NextRequest,
  backendPath: string,
  method: "GET" | "POST",
  body?: unknown
): Promise<NextResponse | null> {
  const base = getFastApiBaseUrl();
  if (!base) return null;

  const requestId = request.headers.get("x-request-id") || makeRequestId();
  const role = request.headers.get("x-user-role") || "Reviewer";

  try {
    const res = await fetch(`${base}${backendPath}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
        "X-User-Role": role,
      },
      body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
      cache: "no-store",
    });

    const payload = await res.json();
    return NextResponse.json(payload, {
      status: res.status,
      headers: {
        "X-Request-ID": res.headers.get("x-request-id") || requestId,
        "X-DocOps-Runtime": "fastapi",
      },
    });
  } catch {
    return null;
  }
}
