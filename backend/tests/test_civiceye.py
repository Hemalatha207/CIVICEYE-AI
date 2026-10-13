import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_login_demo_users():
    # Citizen login
    res_cit = client.post("/api/auth/login", json={"email": "citizen@civiceye.local", "password": "password123"})
    assert res_cit.status_code == 200
    data_cit = res_cit.json()
    assert "access_token" in data_cit
    assert data_cit["user"]["email"] == "citizen@civiceye.local"

    # Manager login
    res_mgr = client.post("/api/auth/login", json={"email": "manager@civiceye.local", "password": "password123"})
    assert res_mgr.status_code == 200
    data_mgr = res_mgr.json()
    assert "access_token" in data_mgr
    assert any(r["name"] == "MANAGER" for r in data_mgr["user"]["roles"])

def test_rbac_citizen_forbidden_manager_endpoints():
    res_cit = client.post("/api/auth/login", json={"email": "citizen@civiceye.local", "password": "password123"})
    cit_token = res_cit.json()["access_token"]
    headers = {"Authorization": f"Bearer {cit_token}"}

    # Citizen trying to access staff management
    res_staff = client.get("/api/staff", headers=headers)
    assert res_staff.status_code == 403

    # Citizen trying to access audit logs
    res_audit = client.get("/api/audit-logs", headers=headers)
    assert res_audit.status_code == 403

def test_ai_analysis_endpoint():
    res_cit = client.post("/api/auth/login", json={"email": "citizen@civiceye.local", "password": "password123"})
    headers = {"Authorization": f"Bearer {res_cit.json()['access_token']}"}

    res_ai = client.post(
        "/api/ai/analyze",
        data={"category_hint": "Pothole"},
        headers=headers
    )
    assert res_ai.status_code == 200
    res_data = res_ai.json()
    assert res_data["success"] is True
    assert res_data["ai_result"]["category"] == "Pothole"
    assert res_data["ai_result"]["confidence"] >= 0.80

def test_full_workflow_end_to_end():
    # 1. Citizen logs in
    res_cit = client.post("/api/auth/login", json={"email": "citizen@civiceye.local", "password": "password123"})
    cit_token = res_cit.json()["access_token"]
    cit_headers = {"Authorization": f"Bearer {cit_token}"}

    # 2. Manager logs in
    res_mgr = client.post("/api/auth/login", json={"email": "manager@civiceye.local", "password": "password123"})
    mgr_token = res_mgr.json()["access_token"]
    mgr_headers = {"Authorization": f"Bearer {mgr_token}"}

    # 3. Citizen reports pothole issue
    issue_payload = {
        "category": "Pothole",
        "description": "Hazardous road pothole near Ward 4 bus stop",
        "latitude": "40.7128",
        "longitude": "-74.0060",
        "address": "450 Broadway, Ward 4",
        "ward": "Ward 4"
    }
    res_issue = client.post("/api/issues", data=issue_payload, headers=cit_headers)
    assert res_issue.status_code == 200
    issue = res_issue.json()
    issue_id = issue["id"]
    assert issue["category"] == "Pothole"
    assert issue["status"] == "REPORTED"

    # 4. Manager verifies issue and sets HIGH priority
    verify_payload = {
        "verified_category": "Pothole",
        "priority": "HIGH",
        "department_id": issue["department_id"] or 1,
        "manager_notes": "Triage verified by manager"
    }
    res_verify = client.post(f"/api/issues/{issue_id}/verify", json=verify_payload, headers=mgr_headers)
    assert res_verify.status_code == 200
    assert res_verify.json()["status"] == "VERIFIED"

    # 5. Manager assigns work order to Kumar Thorne
    staff_res = client.get("/api/staff", headers=mgr_headers)
    assert staff_res.status_code == 200
    worker_id = staff_res.json()[0]["id"]

    wo_payload = {
        "issue_id": issue_id,
        "department_id": issue["department_id"] or 1,
        "worker_id": worker_id,
        "priority": "HIGH",
        "instructions": "Repair pothole near Ward 4 bus stop."
    }
    res_wo = client.post("/api/work-orders", json=wo_payload, headers=mgr_headers)
    assert res_wo.status_code == 200
    wo = res_wo.json()
    wo_id = wo["id"]
    assert wo["status"] == "ASSIGNED"

    # 6. Work started
    res_start = client.put(f"/api/work-orders/{wo_id}/status", json={"status": "WORK_STARTED"}, headers=mgr_headers)
    assert res_start.status_code == 200
    assert res_start.json()["status"] == "WORK_STARTED"

    # 7. Work completed
    res_comp = client.put(f"/api/work-orders/{wo_id}/status", json={"status": "WORK_COMPLETED"}, headers=mgr_headers)
    assert res_comp.status_code == 200
    assert res_comp.json()["status"] == "WORK_COMPLETED"

    # 8. Manager uploads Before/After Evidence
    res_ev = client.post(
        f"/api/work-orders/{wo_id}/evidence",
        data={
            "description": "Asphalt patch applied and compacted.",
            "before_image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800",
            "after_image_url": "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=800"
        },
        headers=mgr_headers
    )
    assert res_ev.status_code == 200

    # 9. Manager verifies completion
    res_ver_wo = client.post(f"/api/work-orders/{wo_id}/verify", headers=mgr_headers)
    assert res_ver_wo.status_code == 200
    assert res_ver_wo.json()["status"] == "VERIFIED"

    # 10. Citizen submits 5-star rating feedback
    fb_payload = {
        "issue_id": issue_id,
        "resolved_status": "YES",
        "rating": 5,
        "comment": "Quick and clean fix! Excellent response."
    }
    res_fb = client.post("/api/feedback", json=fb_payload, headers=cit_headers)
    assert res_fb.status_code == 200
    assert res_fb.json()["rating"] == 5

    # 11. Check audit log recorded events
    res_audit = client.get("/api/audit-logs", headers=mgr_headers)
    assert res_audit.status_code == 200
    assert len(res_audit.json()) > 0
