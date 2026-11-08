# SCRIMS — Full-Stack Esports Tournament Management Platform

> **Precision-engineered tournament operations platform for BGMI, Free Fire MAX, and Clash of Clans.**  
> Featuring concurrency-safe slot bookings, 10-minute temporary mutex holds, WhatsApp payment marshalling, strict capacity-gated custom room credentials, 4-map live telemetry scoring, and real-time Socket.IO chat lobbies.

---

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [Visual Identity & Design System](#visual-identity--design-system)
3. [Technology Stack](#technology-stack)
4. [Architecture & Concurrency Model](#architecture--concurrency-model)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Demo Accounts & 1-Click Switcher](#demo-accounts--1-click-switcher)
7. [Project Structure](#project-structure)
8. [Getting Started (Local Zero-Config)](#getting-started-local-zero-config)
9. [Database & Supabase Setup](#database--supabase-setup)
10. [Running Automated Tests](#running-automated-tests)
11. [Production Deployment Guide](#production-deployment-guide)

---

## 1. Platform Overview

**SCRIMS** is a complete, production-grade esports tournament operations platform designed to eliminate the operational chaos of managing daily competitive scrims in India.

### Key Capabilities:
- **Concurrency-Safe Slot Booking Engine:** Prevents double-booking with 10-minute atomic holds, live countdown badges, and background auto-release workers.
- **Manual WhatsApp Payment Marshalling:** Coordinates external payments through prefilled WhatsApp click-to-chat links and transaction UTR submissions. Match Masters audit receipts and approve or reject (with mandatory reason). *No third-party payment gateway fees or escrow delays.*
- **Strict Capacity-Gated Room Credentials:** Custom Room ID and Password remain encrypted and inaccessible to players until the tournament achieves **100% confirmed squad capacity** (e.g., 16/16 for BGMI). Assigned marshalls retain administrative override access at all times.
- **Live 4-Map Scoring Console:** Rapid-input telemetry console for Score Masters across all four maps (**Erangel, Livik, Rondo, Miramar**). Automatically computes BGMI points ($1 \text{ pt/kill} + \text{Placement } 10/6/2/0$), breaks ties, and writes an immutable audit ledger of every modification.
- **Real-Time Tournament Lobbies:** Persistent Socket.IO room channel with live chat, verified role badges, and high-priority Match Master announcement banners.
- **IST Operational Scheduling:** Strict scheduling enforcement for matches running hourly between **11:00 AM and 11:00 PM Indian Standard Time (IST)**, ending before 11:59 PM.

---

## 2. Visual Identity & Design System

SCRIMS follows an established, high-contrast black-orange esports design system:

| Element | Dark Mode (Default) | Light Mode |
| :--- | :--- | :--- |
| **Background** | Deep Obsidian (`#131313`, `#0E0E0E`) | Pure & Warm Off-White (`#FFFFFF`, `#FFF9F4`) |
| **Cards & Surfaces** | Charcoal Layering (`#1C1B1B`, `#201F1F`) | Crisp White Cards (`#FFFFFF`, `#FFF0E5`) |
| **Primary Accent** | Radiant Esports Orange (`#EA580C`, `#FFB690`)| Radiant Esports Orange (`#EA580C`) |
| **Typography** | **Space Grotesk** (Display/Headings), **Plus Jakarta Sans** (Interface body) |

- **Persistent Theme Switcher:** Fully functional toggle in the navigation header with local preference persistence (`localStorage`).

---

## 3. Technology Stack

### Frontend
- **Framework:** React 19 + Vite (JavaScript & JSX — *strictly no TypeScript*).
- **Styling:** Tailwind CSS with custom design tokens for depth, spacing, and typography.
- **Routing:** React Router v7 with role-based `ProtectedRoute` guards.
- **Icons:** Material Symbols Outlined & Lucide React.
- **State Management:** React Context API (`AuthContext`, `ThemeContext`).
- **Real-time Client:** Socket.IO Client.

### Backend
- **Runtime:** Node.js (ES modules).
- **Web Framework:** Express.js 5.
- **Real-Time Engine:** Socket.IO with JWT handshake authentication.
- **Security:** Helmet, CORS, and Express Rate Limiter.
- **Validation:** Zod schema validation.

### Database & Persistence
- **Dual-Mode Persistence Architecture:**
  1. **Supabase PostgreSQL / Cloud Mode:** Full relational schema across 16 tables with foreign keys, constraints, and Row Level Security (RLS) policies.
  2. **Zero-Config Local Mode:** High-performance in-memory ACID store preloaded with all 5 seed accounts, 3 game configurations, tournaments, 16 slots, and sample scores. Starts instantaneously without requiring external cloud accounts.

---

## 4. Architecture & Concurrency Model

```
[Browser / React Client]
       │
       │ HTTP REST + Socket.IO
       ▼
[Express.js Application]
  ├── Auth Middleware (JWT Claims)
  ├── RBAC Guard (Player, Team Leader, Match Master, Score Master, Super Admin)
  ├── 10-Minute Slot Mutex Engine
  ├── Room Capacity Enforcement Gate (16/16 Confirmed Required)
  └── Telemetry Scoring & Audit Logger
       │
       ▼
[Dual Persistence: Supabase PostgreSQL / Local Cache]
```

### Slot Booking Lifecycle:
1. `AVAILABLE`: Any verified player can click to initiate reservation.
2. `HELD`: Mutex lock placed on slot for exactly 10 minutes. Generates reference `SCRIM-BGMI-XXXXXX` and prefilled WhatsApp link to Match Master.
3. `PENDING_VERIFICATION`: Player or Match Master submits payment UTR. Countdown is paused.
4. `CONFIRMED`: Match Master verifies payment receipt. Slot transitions to `BOOKED` and squad roster is locked.
5. `REJECTED`: If invalid receipt or fraud, Match Master enters mandatory reason; slot immediately returns to `AVAILABLE`.

---

## 5. User Roles & Permissions

| Role | Primary Responsibilities | Access Route |
| :--- | :--- | :--- |
| **`PLAYER`** | Browse tournaments, hold slots, submit UTR, chat in room, view scoreboards. | `/dashboard` |
| **`TEAM_LEADER`**| All player capabilities + create squads, manage 4-player rosters, invite members. | `/team` |
| **`MATCH_MASTER`** | Review payments, verify/reject bookings, manage slots, send room announcements. | `/match-master` |
| **`SCORE_MASTER`** | Record map kills and placement points, inspect audit history. | `/score-master` |
| **`SUPER_ADMIN`** | Full control: schedule tournaments, assign staff, view financial records. | `/admin` |

---

## 6. Demo Accounts & 1-Click Switcher

For seamless review and testing, pre-configured demo credentials are provided. All accounts use password: `Password@123`.

| Role | Email | Password | Gaming Alias |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@scrims.gg` | `Password@123` | `SuperAdmin_Root` |
| **Match Master** | `matchmaster@scrims.gg` | `Password@123` | `Marshall_Ghost` |
| **Score Master** | `scoremaster@scrims.gg` | `Password@123` | `Telemetry_Oracle`|
| **Team Leader** | `teamleader@scrims.gg` | `Password@123` | `Captain_Apex` |
| **Player** | `player@scrims.gg` | `Password@123` | `VortexStriker` |

> **Pro Tip:** In the UI, use the **1-Click Role Switcher** dropdown in the navigation header or on the `/login` portal to instantly switch identities without typing passwords!

---

## 7. Project Structure

```
scrims/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment & Database (Dual-mode Supabase/In-memory)
│   │   ├── controllers/     # Auth, Tournament, Booking, Payment, Score, Chat, Admin
│   │   ├── middleware/      # JWT Auth, RBAC Guards, Error Handler
│   │   ├── routes/          # Express REST routers
│   │   ├── sockets/         # Socket.IO event handlers (Rooms, Chat, Scores)
│   │   ├── utils/           # IST time checker, WhatsApp link & ref generator
│   │   ├── app.js           # Express app setup
│   │   ├── server.js        # Server entrypoint with 15s hold expiry worker
│   │   └── socketInstance.js# Decoupled Socket.IO instance
│   ├── tests/
│   │   └── api.test.js      # Complete 6-suite automated test suite
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Footer, RoleBadge, SlotBadge, ProtectedRoute
│   │   ├── contexts/        # AuthContext (with 1-Click Switcher), ThemeContext
│   │   ├── pages/
│   │   │   ├── TournamentHub.jsx           # Public hub & live schedule
│   │   │   ├── AuthPortalPage.jsx          # Login & registration portal
│   │   │   ├── SlotBookingPage.jsx         # 16-slot grid, hold countdown, WhatsApp
│   │   │   ├── TournamentRoomPage.jsx      # Room credentials gate & 4-map scores
│   │   │   ├── PlayerDashboardPage.jsx     # Bookings & payment history
│   │   │   ├── TeamLeaderPage.jsx          # Squad management & roster lock
│   │   │   ├── MatchMasterDashboardPage.jsx# Payment verification desk
│   │   │   ├── ScoreMasterDashboardPage.jsx# Live scoring telemetry console
│   │   │   └── SuperAdminDashboardPage.jsx # Telemetry, schedules, financials
│   │   ├── services/        # Axios API client & Socket.IO client
│   │   ├── styles/          # Tailwind CSS design system tokens
│   │   ├── App.jsx          # React Router route registry
│   │   └── main.jsx         # Application entrypoint
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
├── database/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql  # 16 tables, foreign keys, indexes
│   │   └── 002_rls_policies.sql    # Supabase Row Level Security policies
│   └── seed/
│       └── seed_data.sql           # 5 users, games, tournaments, slots, scores
├── docs/
│   ├── ARCHITECTURE.md             # System design, data flow, ERD
│   ├── API.md                      # REST endpoints specification
│   └── ROLES_AND_PERMISSIONS.md    # Detailed authorization matrix
├── .env.example
├── package.json
└── README.md
```

---

## 8. Getting Started (Local Zero-Config)

You can run both the frontend and backend locally with zero external database configuration:

### Step 1: Start Backend
```bash
cd backend
npm install
npm run dev
```
*Backend runs on `http://localhost:5000` with WebSocket server and preloaded database.*

### Step 2: Start Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173` with automatic API and WebSocket proxying to port 5000.*

### Step 3: Open in Browser
Navigate to `http://localhost:5173`. Use the **1-Click Demo Login** buttons to explore all 5 roles.

---

## 9. Database & Supabase Setup

To connect to a live Supabase PostgreSQL instance:

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Run the migrations in order:
   - Run `database/migrations/001_initial_schema.sql`
   - Run `database/migrations/002_rls_policies.sql`
   - Run `database/seed/seed_data.sql`
4. Copy your project URL, anon key, and service role key into `backend/.env`:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-public-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
   ```
5. Restart the backend. The backend will automatically bind to your Supabase PostgreSQL cluster.

---

## 10. Running Automated Tests

The backend includes a complete end-to-end automated test suite covering:
1. **Authentication Flow:** Health check, login across all 5 roles, password validation, new player registration.
2. **Role-Based Authorization:** Blocking unauthorized players from administrative endpoints and score updates.
3. **Slot Concurrency & Holds:** 10-minute mutex reservation, duplicate slot lock prevention, WhatsApp URL generation.
4. **Manual Payment Verification:** Match Master auditing, mandatory rejection reason enforcement, payment confirmation, and slot finalization.
5. **BGMI 4-Map Scoring:** Kill point ($1\text{ pt}$) and placement ($10/6/2/0$) calculations, cumulative points aggregation, and immutable score audit ledger.
6. **Financial Metrics:** Verification of expected gross entry collections (BGMI: ₹19,200; Free Fire: ₹9,600; Clash of Clans: ₹2,400) derived from actual DB records.

To run the test suite:
```bash
cd backend
npm test
```

Expected output:
```
✔ SCRIMS Platform Complete Test Suite (all tests passing)
```

---

## 11. Production Deployment Guide (Vercel & Render)

For the complete, step-by-step walkthrough dated **November 7, 2026**, consult [DEPLOYMENT_GUIDE_2026.md](docs/DEPLOYMENT_GUIDE_2026.md).

### Quick Summary:
- **Frontend (Vercel):**
  - Root directory: `frontend`
  - Framework: `Vite` (Build: `npm run build`, Output: `dist`)
  - Configured with `vercel.json` for SPA rewrites (`/(.*)` -> `/index.html`)
  - Environment variables: `VITE_API_URL` & `VITE_SOCKET_URL`
- **Backend (Render):**
  - Configured with `render.yaml` blueprint
  - Root directory: `backend` (Build: `npm install`, Start: `node src/server.js`)
  - Health check path: `/api/health`
  - Persistent WebSocket server on `0.0.0.0` with 15s hold release worker
- **Super Admin Credentials:**
  - `gadekuldeep26@gmail.com` (or `+919309381367`) / `Password@123`

---

## License
MIT © 2026 SCRIMS Architectural Core. All rights reserved.
#   S c r i m s  
 