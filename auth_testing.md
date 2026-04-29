# Night Wave Collective — Auth Testing Playbook

## MongoDB Verification
```
mongosh
use nightwave_db
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
- bcrypt hash should start with `$2b$`
- Indexes should exist: `users.email` (unique), `login_attempts.identifier`, `password_reset_tokens.expires_at` (TTL)

## API Testing (via REACT_APP_BACKEND_URL)
```
API=https://35cfd8b7-a67e-4a12-a66c-9cf6759fc586.preview.emergentagent.com
curl -c cookies.txt -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nightwave.com","password":"NightWave2026!"}'
curl -b cookies.txt "$API/api/auth/me"
```
Expected: login returns user JSON and sets `access_token` + `refresh_token` cookies. `/me` returns the same user.

## Brute Force
6 wrong logins from same email/IP must return 429 lockout.

## Frontend Flow
1. Register at `/register` → expect dashboard redirect.
2. Logout → cookies cleared.
3. Login at `/login` → cookies set, `/portal` accessible.
4. Admin login → `/admin` accessible; non-admins blocked.
