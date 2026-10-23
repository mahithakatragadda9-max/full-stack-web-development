# EcoTrack — Smart Waste Management & Recycling Platform

## Problem statement and objectives
Residents often have no simple way to report waste problems or see whether anyone acted on them. EcoTrack lets residents report issues and track their status, while administrators review reports and update them.

Objectives: (1) let residents submit and track reports, (2) let administrators manage report status, (3) publish anonymous statistics and recycling tips.

## Features
- **Resident:** register/log in, submit report, view own reports and status, edit/delete only while Pending.
- **Administrator:** view all reports, search/filter, change status (Pending, In Progress, Resolved, Rejected), add resolution notes.
- **Public:** home page, public report list (no e-mails), recycling guide, live statistics.

## Technology stack
React + Vite, plain CSS, Node.js + Express, MongoDB + Mongoose, bcryptjs, JWT (HttpOnly cookie), Fetch API, dotenv.

## Folder structure
See the tree in the project root: `client/` (React app: `src/App.jsx`, `api.js`, `styles.css`) and `server/` (`server.js`, `models/`, `scripts/createAdmin.js`).

## Prerequisites
Node.js 18+ and npm, plus MongoDB (local or Atlas).

## MongoDB configuration
**Local:** install MongoDB Community Server (run as a Windows service) and use `MONGO_URI=mongodb://127.0.0.1:27017/ecotrack`.

**Atlas:** create a free cluster, add a database user, under *Network Access* allow your IP, then copy the connection string:
`MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ecotrack?retryWrites=true&w=majority`
(URL-encode special characters in the password.)

## Windows installation and run
Backend (first terminal):
```
cd EcoTrack\server
npm install
copy .env.example .env
notepad .env
npm run create-admin
npm run dev
```
Frontend (second terminal):
```
cd EcoTrack\client
npm install
npm run dev
```
Open http://localhost:5173. The Vite dev server proxies `/api` to http://localhost:5000 (change `client/vite.config.js` if you change `PORT`).

## Environment variables (`server/.env`)
| Name | Purpose |
|---|---|
| PORT | Backend port (default 5000) |
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | Long random string (16+ chars) |
| CLIENT_ORIGIN | Allowed frontend origin (CORS) |
| ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD | Used only by the admin setup script |
| NODE_ENV | `production` enables secure cookies (HTTPS) |

Never commit `.env`.

## Admin account creation
Set the `ADMIN_*` values in `server/.env`, then run `npm run create-admin` once. It creates the admin only if no admin exists. Log in on the normal login page. Remove `ADMIN_PASSWORD` from `.env` afterwards if you wish.

## Main API endpoints
| Method | Route | Access |
|---|---|---|
| POST | /api/auth/register, /api/auth/login, /api/auth/logout | Public |
| GET | /api/auth/me | Public (returns `user: null` if logged out) |
| GET | /api/public/reports?status=&category= | Public (no reporter data) |
| GET | /api/public/stats | Public |
| POST | /api/reports | Resident |
| GET | /api/reports/mine | Resident |
| PUT / DELETE | /api/reports/:id | Owner, Pending only |
| GET | /api/admin/reports?search=&status=&category= | Admin |
| PATCH | /api/admin/reports/:id/status | Admin |

## Database models
**User:** name, email (unique, lowercase), passwordHash, role (`resident` / `admin`), createdAt, updatedAt.

**Report:** referenceId (unique), title, description, category, location, status, reporter (User ref), resolutionNotes, statusHistory [{status, note, changedAt}], createdAt, updatedAt.

## Manual testing checklist
- [ ] Server shows a clear message when MongoDB is not reachable
- [ ] Register a resident; duplicate e-mail is rejected
- [ ] Log in/out; wrong password shows an error
- [ ] Submit a report; it appears in My Reports as Pending
- [ ] Edit and delete a Pending report
- [ ] Edit/delete buttons disappear after admin changes status
- [ ] Resident cannot open Admin Panel
- [ ] Admin login works; all reports are visible
- [ ] Admin search and filters work
- [ ] Admin changes status and adds notes; resident sees them
- [ ] Public Reports page shows no e-mails
- [ ] Statistics update after status changes
- [ ] Recycling Guide displays
- [ ] Layout works on a narrow (mobile-width) window

## Screenshot instructions
See `screenshots/README.md`.

## Group members (edit)
| Name | Roll number | Contribution |
|---|---|---|
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

## Viva questions and answers
1. **Why store the JWT in an HttpOnly cookie?** JavaScript cannot read it, which reduces token theft through XSS.
2. **How are passwords protected?** They are hashed with bcryptjs; plain passwords are never stored.
3. **How do you stop residents editing others' reports?** The server compares the report's reporter with the logged-in user and requires status Pending.
4. **How are admin rights enforced?** Middleware checks the role loaded from the database, not the client.
5. **Why does the public API hide reporter data?** Public queries exclude the reporter field and return a whitelisted set of fields.
6. **Why use a Vite proxy?** The browser sees one origin, so cookies work without CORS problems.

## Limitations and future scope
Limitations: no password reset, no e-mail verification, no CSRF tokens (relies on SameSite cookies), no pagination, no automated tests.
Future scope: image upload, map view, notifications, analytics, password reset, pagination.
