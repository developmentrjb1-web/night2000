# Night Wave Collective — PRD

## Original Problem Statement
Build a modern, high-energy, premium website for a DJ and event collective called Night Wave Collective. Brand: nightlife, DJs, MCs, music events. Fusion of luxury nightclub + music festival. Dark mode (black/cyan/pink/purple), animated elements, futuristic typography, mobile-first. Tagline: "Feel the Beat. Ride the Wave."

## Target Personas
- **Event Organizers** — booking DJs/MCs for clubs, weddings, brand events
- **DJs / MCs** — applying to join the roster, managing schedule
- **Nightlife Members** — following events, claiming perks
- **Admin (Collective)** — managing roster, events, bookings, assignments

## Core Stack
- FastAPI + MongoDB + JWT (bcrypt + Bearer tokens via Authorization header — works through cross-origin ingress)
- React 19 + Tailwind + Shadcn/UI primitives
- Fonts: Unbounded (display), Outfit (body)
- Color palette: #050505 / #0D0D14 / #00E5FF / #FF007F / #B026FF

## Implemented (Apr 29, 2026)
- Public site: Home (hero with animated soundwaves + tagline, services, featured DJs, upcoming events, social CTA), Gallery (filters + lightbox), Events (upcoming/past tabs), Memberships (3 tiers + apply), Booking form (with auto-response success card), Footer, Floating Messenger button, sticky Navbar
- Auth: register, login, logout, /me, brute-force protection (email-keyed lockout 5 attempts / 15min)
- Member portal: profile editor, my schedule (assignments), announcements feed, performance stats
- Admin panel: overview stats, bookings (status update), events CRUD, members list, assignments CRUD, announcements CRUD
- Backend seeds: admin user, 4 DJs, 3 events (2 upcoming + 1 past), 9 gallery items, 1 announcement
- Test suite: 36 backend pytest tests, 100% pass

## Deferred / Backlog
- **P1**: Email notification to `nightwavecollectiveofficial@gmail.com` on new booking (Resend / SendGrid integration)
- **P1**: Real Facebook page embed + Messenger Customer Chat plugin (placeholder URLs in use)
- **P2**: Password reset flow (UI only — backend endpoints stubbed)
- **P2**: Image uploads for DJs/events (currently URL-based)
- **P2**: Hero video background (currently animated CSS + still image)
- **P3**: Stripe / payment for VIP membership subscription
- **P3**: Public DJ profile pages (`/djs/:id`)
- **P3**: SEO meta tags + Open Graph

## Test Credentials
See `/app/memory/test_credentials.md`

## Notes for Future Sessions
- Frontend uses **Bearer tokens in Authorization header** (not httpOnly cookies) because the Kubernetes ingress overrides `Access-Control-Allow-Origin` to `*`, which blocks credentialed cross-origin requests. Cookies are still set as a fallback for same-origin scenarios.
- Booking submission email notification is currently logged to backend logs only (no email sent). Add Resend integration to enable real notifications.
