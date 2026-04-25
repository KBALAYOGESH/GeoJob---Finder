# GeoJobs Backend

Node.js + Express + MongoDB backend for GeoJobs (JWT auth + RBAC).

## Prerequisites
- Node.js (LTS) and npm installed
- MongoDB running locally **or** Docker

## Setup (local)
1. Copy env file:
   - Create `backend/.env` from `backend/.env.example`
2. Install dependencies:
   - `npm install`
3. Start the server:
   - `npm run dev`
4. Health check:
   - `GET http://localhost:4000/api/health`

## Run with Docker
From `backend/`:
- `docker compose up --build`

Backend will be at `http://localhost:4000`.

## Auth quickstart
### Register
`POST /api/auth/register`
```json
{ "email": "a@b.com", "password": "Password123", "role": "jobseeker" }
```

### Login
`POST /api/auth/login`
```json
{ "email": "a@b.com", "password": "Password123" }
```

Use the returned access token as:
- `Authorization: Bearer <accessToken>`

## Main endpoints (REST)
- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- **Jobs**: `GET /api/jobs`, `GET /api/jobs/:id`, `POST /api/jobs` (recruiter/admin), `PATCH /api/jobs/:id`, `DELETE /api/jobs/:id`, `POST /api/jobs/:id/publish`, `POST /api/jobs/:id/close`
- **Applications**: `POST /api/jobs/:id/apply`, `GET /api/applications/me`, `GET /api/jobs/:id/applications`, `PATCH /api/applications/:id/status`
- **Bookmarks**: `POST /api/jobs/:id/bookmark`, `DELETE /api/jobs/:id/bookmark`, `GET /api/bookmarks`
- **Profile**: `GET /api/profile/me`, `PATCH /api/profile/me`, `POST /api/profile/me/resume` (multipart field: `resume`)
- **Notifications**: `GET /api/notifications`, `PATCH /api/notifications/:id/read`
- **Admin** (admin only): `GET /api/admin/metrics`, `GET /api/admin/users`, `PATCH /api/admin/users/:id`, `GET /api/admin/jobs`
- **Recommendations**: `GET /api/recommendations`
- **Messaging (Socket.io)**: connect with `handshake.auth.token = <accessToken>` and emit `message:send`

