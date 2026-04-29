from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import uuid
import secrets
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ---------- Configuration ----------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@nightwave.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "NightWave2026!")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
JWT_ALG = "HS256"
ACCESS_TTL = timedelta(minutes=60)
REFRESH_TTL = timedelta(days=7)
MAX_FAILED = 5
LOCKOUT_MIN = 15

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Night Wave Collective API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
log = logging.getLogger("nightwave")


# ---------- Helpers ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + ACCESS_TTL,
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + REFRESH_TTL,
        "type": "refresh",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    response.set_cookie(
        key="access_token",
        value=access,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=int(ACCESS_TTL.total_seconds()),
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=int(REFRESH_TTL.total_seconds()),
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


def public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "member"),
        "stage_name": user.get("stage_name"),
        "bio": user.get("bio"),
        "specialty": user.get("specialty"),
        "avatar_url": user.get("avatar_url"),
        "created_at": user.get("created_at"),
    }


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---------- Models ----------
RoleType = Literal["admin", "member", "dj", "mc", "elite"]


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=80)
    role: Optional[Literal["member", "dj", "mc"]] = "member"
    stage_name: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    stage_name: Optional[str] = None
    bio: Optional[str] = None
    specialty: Optional[str] = None
    avatar_url: Optional[str] = None


class DJIn(BaseModel):
    name: str
    stage_name: str
    role: Literal["DJ", "MC"] = "DJ"
    bio: str = ""
    specialty: str = ""
    avatar_url: str = ""
    instagram: Optional[str] = None
    featured: bool = False


class EventIn(BaseModel):
    name: str
    date: str  # ISO
    time: str
    venue: str
    description: str = ""
    lineup: List[str] = []
    image_url: str = ""
    status: Literal["upcoming", "past"] = "upcoming"
    ticket_url: Optional[str] = None


class BookingIn(BaseModel):
    full_name: str = Field(min_length=1)
    contact_number: str
    facebook_link: str = ""
    event_type: Literal["DJ Set", "MC Hosting", "Full Event Hosting", "Bar/Club Performance", "Private Event"]
    event_date: str
    venue: str
    budget: str = ""
    message: str = ""


class BookingStatusUpdate(BaseModel):
    status: Literal["new", "contacted", "confirmed", "declined", "completed"]


class MembershipApply(BaseModel):
    tier: Literal["basic", "vip", "elite"]
    motivation: str = ""


class AnnouncementIn(BaseModel):
    title: str
    body: str
    audience: Literal["all", "djs", "mcs", "elite"] = "all"


class AssignmentIn(BaseModel):
    user_id: str
    event_id: str
    role: Literal["DJ", "MC", "HOST"] = "DJ"
    notes: str = ""


# ---------- Auth Endpoints ----------
@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name.strip(),
        "role": body.role or "member",
        "stage_name": body.stage_name,
        "bio": "",
        "specialty": "",
        "avatar_url": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    set_auth_cookies(response, create_access_token(user_id, email), create_refresh_token(user_id))
    return public_user(doc)


@api.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    rec = await db.login_attempts.find_one({"identifier": identifier})
    if rec and rec.get("count", 0) >= MAX_FAILED:
        last = rec.get("last_attempt")
        if isinstance(last, str):
            last = datetime.fromisoformat(last)
        if last and (datetime.now(timezone.utc) - last) < timedelta(minutes=LOCKOUT_MIN):
            raise HTTPException(status_code=429, detail=f"Too many attempts. Try again in {LOCKOUT_MIN} minutes.")
        await db.login_attempts.delete_one({"identifier": identifier})

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(body.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"last_attempt": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    await db.login_attempts.delete_one({"identifier": identifier})
    set_auth_cookies(response, create_access_token(user["id"], user["email"]), create_refresh_token(user["id"]))
    return public_user(user)


@api.post("/auth/logout")
async def logout(response: Response, _: dict = Depends(get_current_user)):
    clear_auth_cookies(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


@api.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(user["id"], user["email"])
        response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none",
                            max_age=int(ACCESS_TTL.total_seconds()), path="/")
        return {"ok": True}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@api.put("/auth/profile")
async def update_profile(body: ProfileUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return public_user(fresh)


# ---------- DJs / Roster ----------
@api.get("/djs")
async def list_djs():
    docs = await db.djs.find({}, {"_id": 0}).to_list(200)
    return docs


@api.post("/djs")
async def create_dj(body: DJIn, _: dict = Depends(require_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.djs.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.delete("/djs/{dj_id}")
async def delete_dj(dj_id: str, _: dict = Depends(require_admin)):
    await db.djs.delete_one({"id": dj_id})
    return {"ok": True}


# ---------- Events ----------
@api.get("/events")
async def list_events(status: Optional[str] = None):
    q: dict = {"status": status} if status else {}
    docs = await db.events.find(q, {"_id": 0}).sort("date", 1).to_list(200)
    return docs


@api.get("/events/{event_id}")
async def get_event(event_id: str):
    doc = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Event not found")
    return doc


@api.post("/events")
async def create_event(body: EventIn, _: dict = Depends(require_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.events.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/events/{event_id}")
async def update_event(event_id: str, body: EventIn, _: dict = Depends(require_admin)):
    res = await db.events.update_one({"id": event_id}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    doc = await db.events.find_one({"id": event_id}, {"_id": 0})
    return doc


@api.delete("/events/{event_id}")
async def delete_event(event_id: str, _: dict = Depends(require_admin)):
    await db.events.delete_one({"id": event_id})
    return {"ok": True}


# ---------- Gallery ----------
@api.get("/gallery")
async def list_gallery(category: Optional[str] = None):
    q = {"category": category} if category else {}
    docs = await db.gallery.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


# ---------- Bookings ----------
@api.post("/bookings")
async def create_booking(body: BookingIn):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "new"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.bookings.insert_one(doc)
    log.info(f"New booking from {doc['full_name']} ({body.event_type}) — notify {os.environ.get('BOOKING_NOTIFICATION_EMAIL')}")
    doc.pop("_id", None)
    return {
        "id": doc["id"],
        "auto_response": "Thank you for booking with Night Wave Collective! Our team will contact you through Facebook Messenger shortly.",
    }


@api.get("/bookings")
async def list_bookings(_: dict = Depends(require_admin)):
    docs = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api.patch("/bookings/{booking_id}")
async def update_booking_status(booking_id: str, body: BookingStatusUpdate, _: dict = Depends(require_admin)):
    res = await db.bookings.update_one({"id": booking_id}, {"$set": {"status": body.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"ok": True}


# ---------- Memberships ----------
@api.post("/memberships/apply")
async def apply_membership(body: MembershipApply, user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user.get("name"),
        "user_email": user.get("email"),
        "tier": body.tier,
        "motivation": body.motivation,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.membership_applications.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/memberships/applications")
async def list_applications(_: dict = Depends(require_admin)):
    docs = await db.membership_applications.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api.patch("/memberships/applications/{app_id}")
async def update_application(app_id: str, status_value: str, _: dict = Depends(require_admin)):
    if status_value not in ("pending", "approved", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid status")
    res = await db.membership_applications.update_one({"id": app_id}, {"$set": {"status": status_value}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"ok": True}


# ---------- Announcements ----------
@api.get("/announcements")
async def list_announcements():
    docs = await db.announcements.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return docs


@api.post("/announcements")
async def create_announcement(body: AnnouncementIn, _: dict = Depends(require_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.announcements.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.delete("/announcements/{ann_id}")
async def delete_announcement(ann_id: str, _: dict = Depends(require_admin)):
    await db.announcements.delete_one({"id": ann_id})
    return {"ok": True}


# ---------- Assignments (admin assigns events to members) ----------
@api.post("/assignments")
async def create_assignment(body: AssignmentIn, _: dict = Depends(require_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.assignments.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/assignments/me")
async def my_assignments(user: dict = Depends(get_current_user)):
    docs = await db.assignments.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    enriched = []
    for d in docs:
        ev = await db.events.find_one({"id": d.get("event_id")}, {"_id": 0})
        d["event"] = ev
        enriched.append(d)
    return enriched


@api.get("/assignments")
async def list_assignments(_: dict = Depends(require_admin)):
    docs = await db.assignments.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for d in docs:
        u = await db.users.find_one({"id": d.get("user_id")}, {"_id": 0})
        d["user"] = public_user(u) if u else None
        ev = await db.events.find_one({"id": d.get("event_id")}, {"_id": 0})
        d["event"] = ev
    return docs


@api.delete("/assignments/{aid}")
async def delete_assignment(aid: str, _: dict = Depends(require_admin)):
    await db.assignments.delete_one({"id": aid})
    return {"ok": True}


# ---------- Admin: users + stats ----------
@api.get("/admin/users")
async def admin_list_users(_: dict = Depends(require_admin)):
    docs = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api.get("/admin/stats")
async def admin_stats(_: dict = Depends(require_admin)):
    return {
        "users": await db.users.count_documents({}),
        "djs": await db.djs.count_documents({}),
        "events": await db.events.count_documents({}),
        "bookings": await db.bookings.count_documents({}),
        "new_bookings": await db.bookings.count_documents({"status": "new"}),
        "applications": await db.membership_applications.count_documents({}),
        "pending_applications": await db.membership_applications.count_documents({"status": "pending"}),
    }


@api.get("/")
async def root():
    return {"service": "Night Wave Collective API", "status": "ok"}


# ---------- Seeds ----------
async def seed_admin():
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Night Wave Admin",
            "role": "admin",
            "stage_name": None,
            "bio": "",
            "specialty": "",
            "avatar_url": "",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        log.info("Admin user seeded.")
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})
        log.info("Admin password updated.")


async def seed_content():
    if await db.djs.count_documents({}) == 0:
        await db.djs.insert_many([
            {"id": str(uuid.uuid4()), "name": "Marco Reyes", "stage_name": "DJ TIDAL", "role": "DJ",
             "bio": "House & techno selector pushing late-night peaks.",
             "specialty": "House / Techno",
             "avatar_url": "https://images.unsplash.com/photo-1606843225535-b5fb8ce46bc2?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
             "instagram": "https://instagram.com/djtidal", "featured": True,
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Sasha Lee", "stage_name": "NEON QUEEN", "role": "DJ",
             "bio": "Genre-fluid sets layered with vocals and synthwave.",
             "specialty": "Synthwave / EDM",
             "avatar_url": "https://images.pexels.com/photos/9005442/pexels-photo-9005442.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
             "instagram": "https://instagram.com/neonqueen", "featured": True,
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "RJ Bautista", "stage_name": "MC PULSE", "role": "MC",
             "bio": "High-energy hype man for clubs and corporate stages.",
             "specialty": "Hosting / Hype",
             "avatar_url": "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
             "instagram": "https://instagram.com/mcpulse", "featured": True,
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Alyssa Ramos", "stage_name": "VOLT", "role": "DJ",
             "bio": "Bass-driven open-format DJ for festivals.",
             "specialty": "Bass / Open Format",
             "avatar_url": "https://images.unsplash.com/photo-1571266028253-6c7e0c1d9dba?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
             "instagram": "https://instagram.com/voltdj", "featured": False,
             "created_at": datetime.now(timezone.utc).isoformat()},
        ])
        log.info("DJs seeded.")

    if await db.events.count_documents({}) == 0:
        await db.events.insert_many([
            {"id": str(uuid.uuid4()), "name": "Wave Saturdays", "date": "2026-03-07", "time": "10:00 PM",
             "venue": "Dap-ayan KM4", "description": "Headlining house sets all night.",
             "lineup": ["DJ TIDAL", "NEON QUEEN", "MC PULSE"],
             "image_url": "https://images.pexels.com/photos/1494666/pexels-photo-1494666.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
             "status": "upcoming", "ticket_url": None,
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Neon Heatwave", "date": "2026-03-14", "time": "9:00 PM",
             "venue": "Skyline Rooftop", "description": "Open-air rooftop with laser show.",
             "lineup": ["VOLT", "DJ TIDAL"],
             "image_url": "https://images.unsplash.com/photo-1578946956849-3b335519f039?crop=entropy&cs=srgb&fm=jpg&q=85&w=940",
             "status": "upcoming", "ticket_url": None,
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Pulse Festival 2025", "date": "2025-12-20", "time": "8:00 PM",
             "venue": "Beachfront Arena", "description": "Year-end blowout — sold out.",
             "lineup": ["NEON QUEEN", "VOLT", "MC PULSE"],
             "image_url": "https://images.pexels.com/photos/6032557/pexels-photo-6032557.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
             "status": "past", "ticket_url": None,
             "created_at": datetime.now(timezone.utc).isoformat()},
        ])
        log.info("Events seeded.")

    if await db.gallery.count_documents({}) == 0:
        gallery_items = [
            ("crowd", "https://images.pexels.com/photos/1494666/pexels-photo-1494666.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "Laser-lit dance floor"),
            ("djs", "https://images.unsplash.com/photo-1606843225535-b5fb8ce46bc2?crop=entropy&cs=srgb&fm=jpg&q=85&w=940", "Behind the decks"),
            ("events", "https://images.pexels.com/photos/6032557/pexels-photo-6032557.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "Club interior"),
            ("crowd", "https://images.unsplash.com/photo-1578946956849-3b335519f039?crop=entropy&cs=srgb&fm=jpg&q=85&w=940", "Crowd energy"),
            ("djs", "https://images.pexels.com/photos/9005442/pexels-photo-9005442.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "Set in motion"),
            ("events", "https://images.unsplash.com/photo-1764258559789-40cf1eb2025f?crop=entropy&cs=srgb&fm=jpg&q=85&w=940", "Neon lines"),
            ("crowd", "https://images.unsplash.com/photo-1571266028253-6c7e0c1d9dba?crop=entropy&cs=srgb&fm=jpg&q=85&w=940", "Hands up"),
            ("djs", "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?crop=entropy&cs=srgb&fm=jpg&q=85&w=940", "MC on stage"),
            ("events", "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "Concert stage"),
        ]
        await db.gallery.insert_many([
            {"id": str(uuid.uuid4()), "category": cat, "url": url, "caption": cap,
             "created_at": datetime.now(timezone.utc).isoformat()}
            for cat, url, cap in gallery_items
        ])
        log.info("Gallery seeded.")

    if await db.announcements.count_documents({}) == 0:
        await db.announcements.insert_one({
            "id": str(uuid.uuid4()),
            "title": "Welcome to the Collective",
            "body": "New roster announcements every Friday. Check the portal for assignments.",
            "audience": "all",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })


async def ensure_indexes():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    try:
        await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    except Exception:
        pass


# ---------- Lifecycle ----------
@app.on_event("startup")
async def on_startup():
    await ensure_indexes()
    await seed_admin()
    await seed_content()
    log.info("Startup complete.")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# Mount router
app.include_router(api)

# CORS — explicit origins for cookie auth
allowed = [FRONTEND_URL, "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
