# 24003-p3-CampusLink-PhucHuy

# CampusLink

A website that helps students connect, support each other and organize study activities on campus:
ask for help and offer help, run help sessions, join study teams, and post lost or found items.

**Stack:** Node.js + Express 5 · MySQL 8 (`mysql2`, prepared statements) · EJS + HTML/CSS/Vanilla JS ·
`express-session` · `bcryptjs` · `dotenv`.

---

## 1. Setup guide

### 1.1 Requirements

| Tool | Version | Check with |
| --- | --- | --- |
| Node.js | 20 or later | `node -v` |
| MySQL Server | 8.0.16 or later (needs `CHECK` constraints) | `mysql --version` |
| Git | any | `git --version` |

Installing MySQL:

- **macOS (Homebrew):** `brew install mysql` then `brew services start mysql`
- **Windows:** install *MySQL Installer* from mysql.com, choose “Server only” or “Developer Default”, and remember the root password you set.
- **Check it runs:** `mysql -u root -p -e "SELECT VERSION();"`

### 1.2 Install and configure

```bash
git clone <your-repo-url> campuslink
cd campuslink
npm install
cp .env.example .env        # Windows (PowerShell): Copy-Item .env.example .env
```

Open `.env` and fill in:

| Variable | Meaning | Example |
| --- | --- | --- |
| `PORT` | Port the website runs on | `3000` |
| `NODE_ENV` | `development` locally, `production` when deployed (enables secure cookies) | `development` |
| `DB_HOST` / `DB_PORT` | Where MySQL runs | `localhost` / `3306` |
| `DB_USER` / `DB_PASSWORD` | A MySQL account that can create databases | `root` / *(your password)* |
| `DB_NAME` | Database name | `campuslink_db` |
| `SESSION_SECRET` | Long random string used to sign the login cookie | see below |

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **Optional – a dedicated MySQL user** instead of `root`:
> ```sql
> CREATE USER 'campuslink'@'localhost' IDENTIFIED BY 'choose-a-password';
> GRANT ALL PRIVILEGES ON campuslink_db.* TO 'campuslink'@'localhost';
> ```
> Then set `DB_USER=campuslink` and `DB_PASSWORD=choose-a-password`.

### 1.3 Create the database

```bash
npm run db:reset
```

This runs `sql/schema.sql` (creates `campuslink_db` and all tables) and `sql/seed.sql` (sample data).
**It deletes all existing CampusLink data**, so run it again whenever `sql/schema.sql` changes.

### 1.4 Run

```bash
npm run dev     # development: restarts when you save a .js file
npm start       # normal start
```

Open <http://localhost:3000>.

### 1.5 Sample accounts

All accounts in `sql/seed.sql` use the password `Password123`.

| Email | What the sample data gives them |
| --- | --- |
| `an@student.test` | Owns a request with 2 pending offers, helper in a scheduled session (with a proposal waiting), owns *Web Dev Study Group* |
| `binh@student.test` | Requester in that session (has to answer the proposal), owns *Calculus II Crew* |
| `chau@student.test` | Owns *Morning Runners* and *English Writing Circle*, has Lost & Found posts |

### 1.6 Troubleshooting

| Problem | Fix |
| --- | --- |
| `Could not connect to MySQL: Access denied` | Wrong `DB_USER` / `DB_PASSWORD` in `.env` |
| `Could not connect to MySQL: connect ECONNREFUSED` | MySQL isn’t running (`brew services start mysql`, or start the MySQL service on Windows) |
| `SESSION_SECRET is missing` | Add `SESSION_SECRET=...` to `.env` |
| `EADDRINUSE: address already in use :::3000` | Another app uses port 3000 – change `PORT` in `.env` |
| `Check constraint ... is violated` / `Unknown column` | Your database is older than the code – run `npm run db:reset` |
| “This form has expired” | The server restarted (sessions are kept in memory). Refresh the page and log in again |

---

## 2. Database design

All tables use InnoDB, `BIGINT UNSIGNED` primary keys, `utf8mb4`, and foreign keys.
Full definitions with comments: [`sql/schema.sql`](sql/schema.sql).

```mermaid
erDiagram
    users ||--o{ help_requests : "posts"
    users ||--o{ help_offers : "sends (helper)"
    help_requests ||--o{ help_offers : "receives"
    help_requests ||--o{ help_sessions : "has"
    help_offers ||--o| help_sessions : "accepted offer creates"
    users ||--o{ help_sessions : "requester / helper"
    users ||--o{ teams : "owns"
    teams ||--o{ team_members : "has"
    users ||--o{ team_members : "joins"
    teams ||--o{ team_sessions : "organises"
    users ||--o{ team_sessions : "creates"
    teams ||--o{ team_signals : "has"
    users ||--o{ team_signals : "sends"
    users ||--o{ lost_found_posts : "posts"

    users {
        bigint id PK
        varchar full_name
        varchar email UK
        varchar password_hash "bcrypt"
        varchar major "nullable"
        datetime created_at
    }
    help_requests {
        bigint id PK
        bigint user_id FK
        varchar title
        text description
        enum category "programming, math, writing, campus_life, other"
        enum support_mode "in_person, online"
        varchar location_label "nullable"
        datetime scheduled_at "nullable"
        enum status "open, matched, completed, cancelled"
    }
    help_offers {
        bigint id PK
        bigint help_request_id FK
        bigint helper_user_id FK
        varchar message
        enum preferred_mode
        enum status "pending, accepted, declined, withdrawn, closed"
        bigint active_helper_id "generated, UNIQUE with request"
    }
    help_sessions {
        bigint id PK
        bigint help_request_id FK
        bigint help_offer_id FK "UNIQUE"
        bigint requester_user_id FK
        bigint helper_user_id FK
        enum mode
        datetime scheduled_at
        varchar location_label
        enum status "scheduled, in_progress, completed, cancelled"
        bigint proposed_by_user_id FK "pending change, nullable"
    }
    teams {
        bigint id PK
        bigint owner_user_id FK
        varchar name
        varchar description
    }
    team_members {
        bigint team_id PK, FK
        bigint user_id PK, FK
        datetime joined_at
    }
    team_sessions {
        bigint id PK
        bigint team_id FK
        bigint created_by_user_id FK
        varchar title
        datetime starts_at
        datetime ends_at "CHECK ends_at > starts_at"
        enum status "scheduled, cancelled"
    }
    team_signals {
        bigint id PK
        bigint team_id FK
        bigint sender_user_id FK
        varchar message
        varchar location_label
        datetime expires_at
        datetime cancelled_at "nullable"
    }
    lost_found_posts {
        bigint id PK
        bigint user_id FK
        enum post_type "lost, found"
        varchar title
        enum category
        varchar location_label
        varchar image_url "nullable, http(s) only"
        varchar contact_info "nullable, only if opted in"
        enum status "open, resolved, closed"
    }
```

### Status flows

```
Help request:  open ──accept offer──> matched ──session completed──> completed
                 │                       └──session cancelled──> owner reopens (open) or cancels
                 └──owner cancels──> cancelled

Help offer:    pending ──> accepted | declined | withdrawn | closed (another offer accepted / request cancelled)

Help session:  scheduled ──start──> in_progress ──complete──> completed
                   └──────────cancel──────┴──> cancelled
               (while scheduled, either side proposes new mode/time/place; the other accepts)

Lost & Found:  open <──> resolved, open <──> closed   (owner can reopen)
```

### Rules the database enforces itself

- `users.email` is unique.
- One **active** offer per helper per request: `UNIQUE (help_request_id, active_helper_id)`, where
  `active_helper_id` is a generated column that is NULL once the offer is no longer pending/accepted.
- One session per accepted offer: `UNIQUE (help_offer_id)`.
- A user can join a team once: primary key `(team_id, user_id)`.
- Team sessions must end after they start: `CHECK (ends_at > starts_at)`.

---

## 3. Pages

| Page | URL | Who can open it |
| --- | --- | --- |
| Home | `/` | Everyone |
| Find Help (search, filters, sort, pages) | `/help` | Everyone |
| Help request | `/help/:id` | Everyone; offers only for the owner, own offer for the helper |
| Post / edit request | `/help/new`, `/help/:id/edit` | Logged in / owner |
| Offer help | `/help/:id/offer` | Logged in, not the owner, request open |
| My offers | `/offers` | Logged in |
| Help sessions | `/sessions`, `/sessions/:id` | The two participants |
| Study Teams | `/teams`, `/teams/:id` | Everyone (members also see members, sessions, signals) |
| Create / edit team | `/teams/new`, `/teams/:id/edit` | Logged in / owner |
| Team session / event | `/teams/:id/sessions/...` | Team members |
| Lost & Found | `/lost-found`, `/lost-found/:id` | Everyone |
| Post / edit Lost & Found | `/lost-found/new`, `/lost-found/:id/edit` | Logged in / owner |
| Sign up, Log in | `/register`, `/login` | Guests |
| My Account | `/account`, `/account/edit` | Logged in (own data only) |

## 4. REST API (read-only)

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/help-requests` | Query: `q`, `category`, `mode`, `status` (default `open`, or `all`), `sort` (`newest`/`soonest`), `page` |
| GET | `/api/help-requests/:id` | One help request |
| GET | `/api/lost-found` | Query: `q`, `type` (`lost`/`found`), `category`, `posted` (`1`/`7`/`30` days), `status`, `page` |
| GET | `/api/lost-found/:id` | One Lost & Found post |

```bash
curl "http://localhost:3000/api/help-requests?category=math&mode=online&page=1"
```

Errors come back as `{ "error": "message" }` with a matching status code (400/401/403/404/500).

---

## 5. Project structure

```
app.js                 # Sets up Express, sessions, view engine, routes
config/db.js           # MySQL connection pool + withTransaction()
config/constants.js    # Categories, modes, statuses + display labels
routes/                # Maps URLs -> controllers (+ which guards apply)
controllers/           # Handles the request, calls services, renders a view / returns JSON
services/              # SQL queries and business rules
middleware/            # auth (login guards), teamAccess, csrf, flash, errorHandler
validators/            # Server-side form validation
utils/                 # Formatting, pagination, list query parsing, safe redirects
views/                 # EJS templates (partials: head, header, footer, cards, pagination...)
public/                # Static CSS and browser JavaScript
database/setup.js      # npm run db:reset
sql/                   # schema.sql, seed.sql
```

Request flow: `routes` → `middleware` → `controllers` → `services` (MySQL) → `views` (EJS) → HTML.

## 6. Security and privacy

- Passwords are hashed with bcrypt; failed logins show one generic message and take the same time whether or not the email exists.
- The session id is regenerated at login; the cookie is `httpOnly`, `sameSite=lax`, and `secure` in production.
- Every form that changes data carries a CSRF token (`views/partials/csrfField.ejs`).
- All SQL uses `?` placeholders. Sort orders and filters come from fixed allow-lists.
- EJS `<%= %>` escapes everything users type, so HTML/JS in posts is shown as text.
- Permissions are checked on the server for every request (owner, participant, team member), and again inside the SQL `UPDATE`.
- Multi-step changes (accepting offers, session actions, leaving teams) run in transactions with row locks.
- Emails are never public. A help session shows each participant the other's email; nobody else can open it.
- Lost & Found contact info is stored only when the poster ticks “show my contact info”; photo links must be http(s).
- `returnTo` after login only accepts paths on this site (no open redirects).
- Sessions use the default in-memory store: restarting the server logs everyone out. Use a persistent
  store (e.g. `express-mysql-session`) before deploying.

## 7. Accessibility, responsive design and browser support

- Every form field has a label; errors are listed in a summary at the top (focus moves there) and next to each field.
- Pages use landmarks (`header`, `nav`, `main`, `footer`), a skip link and a logical heading order.
- All controls work with the keyboard and show a clear focus outline. Confirmation dialogs are native.
- Text colours meet WCAG AA contrast (4.5:1).
- Layout works from 320 px phones to desktops; the menu collapses below 1100 px.
- Buttons show a spinner and are disabled while a form is sending (no double posts).
- Everything works without JavaScript; JS only adds conveniences (menu toggle, showing/hiding optional fields, confirmations).

**Tested** with Playwright on Chromium, Firefox and WebKit (Safari's engine) at 1280 px and 375 px
(26 pages, logged in and out, plus menu, form toggles, confirmation, validation and loading-state checks),
and with axe-core (WCAG 2.2 AA + best practices): no violations.

Manual checklist before a demo, in Chrome, Firefox and Safari:

1. Sign up, log out, log in again (and get redirected back to the page you wanted).
2. Post a help request; from another account offer help; accept it; agree on details; start and complete the session.
3. Create a team, join it from another account, send a Team Signal, create a session.
4. Post a Lost & Found item with contact info; mark it resolved.
5. Resize to phone width: open the menu, fill a form, page through a list.
6. Tab through a form with the keyboard only.

---

## 8. Progress

- [x] Milestone 1 — Setup: Express, EJS, MySQL connection, layout, Home page
- [x] Milestone 2 — Help requests: list with search/filters/sorting/pagination, detail, create, edit, cancel
- [x] Milestone 3 — Sign up, log in, log out (bcrypt + sessions), protected routes, owner checks, CSRF
- [x] Milestone 4 — Offer Help and Help Sessions (offers, accept/decline, sessions with agreed details, start/complete/cancel, reopen)
- [x] Milestone 5 — Teams (search, join/leave, ownership transfer, members-only sessions/events and Team Signals)
- [x] Milestone 6 — Lost & Found and My Account
- [x] Milestone 7 — Polish: accessibility, responsive layout, loading/empty/error states, cross-browser testing, documentation
