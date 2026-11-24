from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_endpoint_returns_envelope_and_request_id():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert "X-Request-ID" in resp.headers
    body = resp.json()
    assert body["request_id"] == resp.headers["X-Request-ID"]
    assert "timestamp" in body
    assert body["data"]["status"] == "ok"
    assert body["data"]["documents_indexed"] >= 4


def test_list_and_ingest_documents():
    list_resp = client.get("/api/v1/documents")
    assert list_resp.status_code == 200
    initial_count = len(list_resp.json()["data"])

    viewer_resp = client.post(
        "/api/v1/documents",
        headers={"X-User-Role": "Viewer"},
        json={
            "title": "Blocked Upload",
            "category": "Policy",
            "language": "EN",
            "content": "This upload should be blocked because Viewer is read-only.",
        },
    )
    assert viewer_resp.status_code == 403

    create_resp = client.post(
        "/api/v1/documents",
        headers={"X-User-Role": "Admin"},
        json={
            "title": "Cloud Security Addendum 2026",
            "category": "Security Policy",
            "language": "EN",
            "content": (
                "All encryption keys must rotate every 90 days using HSM-backed storage. "
                "Any security breach triggers immediate uncapped indemnity review."
            ),
        },
    )
    assert create_resp.status_code == 201
    created = create_resp.json()["data"]
    assert created["title"] == "Cloud Security Addendum 2026"
    assert created["status"] == "Flagged"
    assert created["chunk_count"] >= 1

    after_resp = client.get("/api/v1/documents")
    assert len(after_resp.json()["data"]) == initial_count + 1


def test_bilingual_rag_query_english_and_arabic():
    en_resp = client.post(
        "/api/v1/rag/query",
        headers={"X-User-Role": "Reviewer"},
        json={"query": "What is the SLA uptime and liability cap?", "language": "en", "top_k": 3},
    )
    assert en_resp.status_code == 200
    en_data = en_resp.json()["data"]
    assert len(en_data["citations"]) >= 1
    assert "[1]" in en_data["answer"]

    ar_resp = client.post(
        "/api/v1/rag/query",
        headers={"X-User-Role": "Reviewer"},
        json={"query": "ما هي مهلة الإبلاغ عن تسريب البيانات الشخصية؟", "language": "ar", "top_k": 3},
    )
    assert ar_resp.status_code == 200
    ar_data = ar_resp.json()["data"]
    assert len(ar_data["citations"]) >= 1
    assert any("PDPL" in c["document_title"] or "72" in c["excerpt"] for c in ar_data["citations"])


def test_approvals_rbac_enforcement_and_audit_trail():
    approvals_resp = client.get("/api/v1/approvals")
    assert approvals_resp.status_code == 200
    target_id = approvals_resp.json()["data"][0]["id"]

    denied_resp = client.post(
        f"/api/v1/approvals/{target_id}/decision",
        headers={"X-User-Role": "Viewer"},
        json={"decision": "approve", "comment": "Viewer attempt"},
    )
    assert denied_resp.status_code == 403

    ok_resp = client.post(
        f"/api/v1/approvals/{target_id}/decision",
        headers={"X-User-Role": "Reviewer"},
        json={"decision": "request_revision", "comment": "Add 2x liability super-cap."},
    )
    assert ok_resp.status_code == 200
    updated = ok_resp.json()["data"]
    assert updated["status"] == "Revision Requested"
    assert updated["last_actor"] == "Reviewer"

    audit_resp = client.get("/api/v1/audit-logs")
    assert audit_resp.status_code == 200
    logs = audit_resp.json()["data"]
    assert len(logs) >= 3
    assert any(log["action"] == "APPROVAL_DECISION" for log in logs)
    assert any(log["action"] == "APPROVAL_DECISION_DENIED" for log in logs)
