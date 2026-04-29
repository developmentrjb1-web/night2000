"""Night Wave Collective - Backend API tests"""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://wave-energy-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@nightwave.com"
ADMIN_PASSWORD = "NightWave2026!"


@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    body = r.json()
    assert body.get("role") == "admin"
    return s


@pytest.fixture(scope="session")
def member_session():
    s = requests.Session()
    email = f"TEST_member_{uuid.uuid4().hex[:8]}@nightwave.com"
    r = s.post(f"{API}/auth/register", json={
        "email": email, "password": "Member2026!", "name": "Test Member", "role": "member"
    })
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    s.email = email
    return s


# ---------- Root ----------
def test_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ---------- Auth ----------
class TestAuth:
    def test_register_and_me(self):
        s = requests.Session()
        email = f"TEST_reg_{uuid.uuid4().hex[:8]}@nightwave.com"
        r = s.post(f"{API}/auth/register", json={"email": email, "password": "Pass2026!", "name": "Reg User"})
        assert r.status_code == 200
        data = r.json()
        # Backend lowercases email
        assert data["email"] == email.lower()
        email = email.lower()
        assert data["role"] == "member"
        # /me with cookie
        me = s.get(f"{API}/auth/me")
        assert me.status_code == 200
        assert me.json()["email"] == email

    def test_register_duplicate(self):
        email = f"TEST_dup_{uuid.uuid4().hex[:8]}@nightwave.com"
        requests.post(f"{API}/auth/register", json={"email": email, "password": "Pass2026!", "name": "x"})
        r = requests.post(f"{API}/auth/register", json={"email": email, "password": "Pass2026!", "name": "x"})
        assert r.status_code == 400

    def test_login_admin(self, admin_session):
        r = admin_session.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code in (401, 429)

    def test_logout(self):
        s = requests.Session()
        email = f"TEST_lo_{uuid.uuid4().hex[:8]}@nightwave.com"
        s.post(f"{API}/auth/register", json={"email": email, "password": "Pass2026!", "name": "x"})
        r = s.post(f"{API}/auth/logout")
        assert r.status_code == 200
        # /me should now fail
        me = s.get(f"{API}/auth/me")
        assert me.status_code == 401

    def test_brute_force_lockout(self):
        # Create dedicated account so lockout doesn't affect admin
        s = requests.Session()
        email = f"TEST_bf_{uuid.uuid4().hex[:8]}@nightwave.com"
        s.post(f"{API}/auth/register", json={"email": email, "password": "Right2026!", "name": "x"})
        last_status = None
        # Note: backend uses request.client.host; behind k8s ingress IP may vary, so try more attempts
        for _ in range(15):
            r = requests.post(f"{API}/auth/login", json={"email": email, "password": "wrongpass"})
            last_status = r.status_code
            if last_status == 429:
                break
        assert last_status == 429, f"Expected 429 after brute force, got {last_status}"


# ---------- Public endpoints ----------
class TestPublic:
    def test_djs(self):
        r = requests.get(f"{API}/djs")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    def test_events_all(self):
        r = requests.get(f"{API}/events")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_events_upcoming(self):
        r = requests.get(f"{API}/events", params={"status": "upcoming"})
        assert r.status_code == 200
        for e in r.json():
            assert e["status"] == "upcoming"

    def test_events_past(self):
        r = requests.get(f"{API}/events", params={"status": "past"})
        assert r.status_code == 200
        for e in r.json():
            assert e["status"] == "past"

    def test_event_detail(self):
        events = requests.get(f"{API}/events").json()
        eid = events[0]["id"]
        r = requests.get(f"{API}/events/{eid}")
        assert r.status_code == 200
        assert r.json()["id"] == eid

    def test_event_404(self):
        r = requests.get(f"{API}/events/nonexistent")
        assert r.status_code == 404

    def test_gallery(self):
        r = requests.get(f"{API}/gallery")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_gallery_filtered(self):
        r = requests.get(f"{API}/gallery", params={"category": "crowd"})
        assert r.status_code == 200
        for g in r.json():
            assert g["category"] == "crowd"

    def test_announcements(self):
        r = requests.get(f"{API}/announcements")
        assert r.status_code == 200


# ---------- Bookings ----------
class TestBookings:
    def test_create_booking_no_auth(self):
        r = requests.post(f"{API}/bookings", json={
            "full_name": "TEST_Booker",
            "contact_number": "+639171234567",
            "facebook_link": "https://facebook.com/test",
            "event_type": "DJ Set",
            "event_date": "2026-04-01",
            "venue": "Test Venue",
            "budget": "10000",
            "message": "test booking"
        })
        assert r.status_code == 200
        d = r.json()
        assert "id" in d
        assert "auto_response" in d
        assert "Facebook Messenger" in d["auto_response"]

    def test_list_bookings_admin_only(self, admin_session):
        r = admin_session.get(f"{API}/bookings")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_list_bookings_no_auth(self):
        r = requests.get(f"{API}/bookings")
        assert r.status_code == 401

    def test_list_bookings_member_403(self, member_session):
        r = member_session.get(f"{API}/bookings")
        assert r.status_code == 403

    def test_update_booking_status(self, admin_session):
        # create one
        c = requests.post(f"{API}/bookings", json={
            "full_name": "TEST_Status",
            "contact_number": "+1",
            "event_type": "MC Hosting",
            "event_date": "2026-05-01",
            "venue": "X"
        })
        bid = c.json()["id"]
        r = admin_session.patch(f"{API}/bookings/{bid}", json={"status": "contacted"})
        assert r.status_code == 200


# ---------- Memberships ----------
class TestMemberships:
    def test_apply_requires_auth(self):
        r = requests.post(f"{API}/memberships/apply", json={"tier": "vip", "motivation": "x"})
        assert r.status_code == 401

    def test_apply_with_auth(self, member_session):
        r = member_session.post(f"{API}/memberships/apply", json={"tier": "vip", "motivation": "want in"})
        assert r.status_code == 200
        assert r.json()["tier"] == "vip"
        assert r.json()["status"] == "pending"

    def test_admin_list_applications(self, admin_session):
        r = admin_session.get(f"{API}/memberships/applications")
        assert r.status_code == 200

    def test_member_cannot_list_applications(self, member_session):
        r = member_session.get(f"{API}/memberships/applications")
        assert r.status_code == 403


# ---------- Admin ----------
class TestAdmin:
    def test_admin_users(self, admin_session):
        r = admin_session.get(f"{API}/admin/users")
        assert r.status_code == 200
        users = r.json()
        # Ensure password_hash NOT exposed
        for u in users[:5]:
            assert "password_hash" not in u

    def test_admin_stats(self, admin_session):
        r = admin_session.get(f"{API}/admin/stats")
        assert r.status_code == 200
        body = r.json()
        for key in ("users", "djs", "events", "bookings", "applications"):
            assert key in body

    def test_admin_users_member_403(self, member_session):
        r = member_session.get(f"{API}/admin/users")
        assert r.status_code == 403

    def test_admin_stats_member_403(self, member_session):
        r = member_session.get(f"{API}/admin/stats")
        assert r.status_code == 403


# ---------- Events CRUD ----------
class TestEventsCRUD:
    def test_event_lifecycle(self, admin_session):
        # create
        payload = {
            "name": "TEST_Event",
            "date": "2026-09-09",
            "time": "10:00 PM",
            "venue": "Test Hall",
            "description": "test",
            "lineup": ["DJ TEST"],
            "image_url": "https://example.com/x.jpg",
            "status": "upcoming",
        }
        r = admin_session.post(f"{API}/events", json=payload)
        assert r.status_code == 200
        eid = r.json()["id"]
        # update
        payload["name"] = "TEST_Event_Updated"
        r2 = admin_session.put(f"{API}/events/{eid}", json=payload)
        assert r2.status_code == 200
        assert r2.json()["name"] == "TEST_Event_Updated"
        # verify via GET
        r3 = requests.get(f"{API}/events/{eid}")
        assert r3.json()["name"] == "TEST_Event_Updated"
        # delete
        r4 = admin_session.delete(f"{API}/events/{eid}")
        assert r4.status_code == 200
        # confirm gone
        r5 = requests.get(f"{API}/events/{eid}")
        assert r5.status_code == 404

    def test_create_event_member_403(self, member_session):
        r = member_session.post(f"{API}/events", json={
            "name": "x", "date": "2026-01-01", "time": "10pm", "venue": "x"
        })
        assert r.status_code == 403


# ---------- Assignments ----------
class TestAssignments:
    def test_assignment_flow(self, admin_session, member_session):
        # get current member id
        me = member_session.get(f"{API}/auth/me").json()
        # get an event
        ev = requests.get(f"{API}/events").json()[0]
        # admin creates
        r = admin_session.post(f"{API}/assignments", json={
            "user_id": me["id"], "event_id": ev["id"], "role": "DJ", "notes": "test"
        })
        assert r.status_code == 200
        aid = r.json()["id"]
        # member sees
        mine = member_session.get(f"{API}/assignments/me")
        assert mine.status_code == 200
        assert any(a["id"] == aid for a in mine.json())
        # admin lists
        all_a = admin_session.get(f"{API}/assignments")
        assert all_a.status_code == 200
        # delete
        d = admin_session.delete(f"{API}/assignments/{aid}")
        assert d.status_code == 200

    def test_assignments_admin_only(self, member_session):
        r = member_session.get(f"{API}/assignments")
        assert r.status_code == 403


# ---------- Announcements admin ----------
class TestAnnouncementsAdmin:
    def test_create_and_delete(self, admin_session):
        r = admin_session.post(f"{API}/announcements", json={
            "title": "TEST_Ann", "body": "hello", "audience": "all"
        })
        assert r.status_code == 200
        aid = r.json()["id"]
        d = admin_session.delete(f"{API}/announcements/{aid}")
        assert d.status_code == 200

    def test_create_member_403(self, member_session):
        r = member_session.post(f"{API}/announcements", json={"title": "x", "body": "y"})
        assert r.status_code == 403


# ---------- Profile ----------
class TestProfile:
    def test_profile_update(self, member_session):
        r = member_session.put(f"{API}/auth/profile", json={"bio": "TEST_BIO_UPDATE", "stage_name": "TEST_STAGE"})
        assert r.status_code == 200
        assert r.json()["bio"] == "TEST_BIO_UPDATE"
        # verify via /me
        me = member_session.get(f"{API}/auth/me").json()
        assert me["bio"] == "TEST_BIO_UPDATE"
        assert me["stage_name"] == "TEST_STAGE"
