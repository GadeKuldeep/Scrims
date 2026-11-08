# 🏆 SCRIMS — Full-Stack Esports Tournament Management Platform

> **Precision-engineered tournament operations platform for BGMI, Free Fire MAX, and Clash of Clans.**  
> Featuring high-concurrency slot reservations with 10-minute temporary holds, WhatsApp payment verification, strict capacity-gated custom room credentials, 4-map live telemetry scoring, interactive 3D trophy showcase, and an integrated profile & mobile management system.

---

## ⚡ Key Highlights

* **🎯 100% Dynamic Tournament Control:** Zero dummy tournaments or fake bookings. Every tournament, tier, prize pool, and match is managed dynamically by the Super Admin.
* **🛡️ Single Authenticated Super Admin:** Configured for **Kuldeep Gade** (`gadekuldeep26@gmail.com` / `919309381367`).
* **🔑 Clean Gmail & Password Authentication:** Streamlined, distraction-free sign-in using only registered Gmail and password.
* **📱 Profile & Mobile Management Drawer:** Slide-over account drawer and dedicated `/profile` hub for linking WhatsApp numbers, configuring in-game IDs (IGN), and managing security credentials.
* **🔒 Concurrency-Safe Slot Reservation:** Atomic 10-minute slot holds that prevent double-booking during high-traffic drops.
* **💳 WhatsApp UTR Payment Marshalling:** Match Masters verify transaction references (UTR/UPI) before issuing slot confirmations.
* **📡 Real-Time Room & Chat Lobbies:** Capacity-gated room credentials (ID & Password) delivered automatically to verified rosters with real-time Socket.IO chat.
* **📊 4-Map Live Telemetry Scoring:** Instant kill point and placement point calculation with live tie-breaker sorting.
* **🌟 3D Championship Trophy Hero:** Interactive 24K gold trophy rendered with Three.js studio lighting and particles.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide / Material Symbols, Three.js / React Three Fiber |
| **Backend** | Node.js, Express 4, Socket.IO, JWT, bcryptjs, In-Memory DB + Supabase SQL |
| **Database** | PostgreSQL / Supabase Schema (RLS policies + transaction-safe migrations) |
| **Deployment** | Vercel (Frontend Client) + Render (Backend Web Service) |
| **Timezone** | Asia/Kolkata (`IST`, UTC+05:30) |

---

## 📁 Project Architecture

```
Scrims/
├── .env                       # Unified root environment configuration
├── .env.example               # Environment template for local & production
├── .gitignore                 # Strict secret & build exclusion rules
├── render.yaml                # Infrastructure-as-code for Render deployment
├── vercel.json                # Single-page app routing rules for Vercel
├── package.json               # Root scripts for testing & concurrent run
│
├── backend/                   # Express 4 REST & WebSocket API
│   ├── src/
│   │   ├── config/            # Database memory store, env parser & constants
│   │   ├── controllers/       # Auth, Tournaments, Bookings, Payments, Scores, Admin
│   │   ├── middleware/        # JWT verification, RBAC, error handling
│   │   ├── routes/            # Express router modules
│   │   ├── sockets/           # Socket.IO room chat & live scoring events
│   │   ├── utils/             # IST time conversion & booking reference generators
│   │   ├── app.js             # Express application assembly & CORS configuration
│   │   └── server.js          # HTTP & WebSocket server bootstrap
│   └── tests/
│       └── api.test.js        # Automated test suite (Auth, Slots, Payments, Scores)
│
├── frontend/                  # React 19 + Vite Esports Hub
│   ├── public/                # 3D GLB models, vehicle audio, custom fonts
│   └── src/
│       ├── components/        # Navbar with Profile Drawer, 3D Hero Trophy, Badges
│       ├── contexts/          # AuthContext (JWT session), ThemeContext
│       ├── pages/
│       │   ├── AuthPortalPage.jsx            # Clean Gmail + Password Sign In & Register
│       │   ├── ProfilePage.jsx               # Mobile number & player identity management
│       │   ├── TournamentHub.jsx             # Public tournaments browser & 3D hero
│       │   ├── SlotBookingPage.jsx           # 10-minute hold slot reservation flow
│       │   ├── TournamentRoomPage.jsx        # Capacity-gated room credentials & chat
│       │   ├── PlayerDashboardPage.jsx       # Player booking history & slot passes
│       │   ├── TeamLeaderPage.jsx            # Squad roster management
│       │   ├── MatchMasterDashboardPage.jsx  # WhatsApp payment UTR verification
│       │   ├── ScoreMasterDashboardPage.jsx  # 4-map telemetry score entry
│       │   └── SuperAdminDashboardPage.jsx   # Tournament creation & financial metrics
│       ├── services/          # Axios API client & Socket.IO connection manager
│       └── styles/            # Tailwind CSS esports design system
│
├── database/
│   ├── migrations/            # Initial schema & Row Level Security (RLS)
│   └── seed/                  # Production seed data (Super Admin Kuldeep Gade only)
│
└── docs/                      # Technical specifications & guides
    ├── API.md                 # Complete REST endpoint specifications
    ├── ARCHITECTURE.md        # Concurrency & hold lifecycle design
    ├── ROLES_AND_PERMISSIONS.md # RBAC privilege matrix
    └── DEPLOYMENT_GUIDE_2026.md # 2026 deployment guide for Render & Vercel
```

---

## 🔐 Super Admin Credentials

The platform is seeded with a single Super Admin account:

* **Name:** `Kuldeep Gade`
* **Email:** `gadekuldeep26@gmail.com`
* **Mobile Number:** `919309381367` (or `+919309381367`)
* **Default Password:** `Password@123`
* **Role:** `SUPER_ADMIN`

*(All mock tournaments, fake teams, and test scores have been eliminated. Tournaments are created dynamically through the Super Admin Command Desk).*

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
* **Node.js:** v18.0.0 or higher
* **npm:** v9.0.0 or higher

### 2. Configure Environment
A unified `.env` file at the root of `Scrims/` powers both backend and frontend:

```env
# Server
PORT=5000
NODE_ENV=development
JWT_SECRET=scrims_jwt_super_secure_vault_key_2026_xyz987
JWT_EXPIRES_IN=7d

# Super Admin Account
SUPER_ADMIN_NAME="Kuldeep Gade"
SUPER_ADMIN_MOBILE="919309381367"
SUPER_ADMIN_EMAIL="gadekuldeep26@gmail.com"
SUPER_ADMIN_PASSWORD="Password@123"

# Frontend Vite Client
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 4. Run the Platform
Open two separate terminals from the root `Scrims/` folder:

**Terminal 1 — Backend API Server:**
```bash
npm run dev --prefix backend
# Runs on http://localhost:5000 (Health Check: http://localhost:5000/api/health)
```

**Terminal 2 — Frontend Client:**
```bash
npm run dev --prefix frontend
# Runs on http://localhost:5173
```

---

## 🧪 Automated Testing & Production Builds

### Run Backend Tests
Run the comprehensive 7-suite integration test covering authentication, authorization, slot mutex holds, payment approvals, and scoring:
```bash
npm test --prefix backend
```

### Build Frontend
Compile the production frontend bundle with Vite:
```bash
npm run build --prefix frontend
```

---

## 🌐 Production Deployment Guide

### Deploying Backend to Render
1. Push your repository to GitHub: `https://github.com/GadeKuldeep/Scrims.git`.
2. In the [Render Dashboard](https://dashboard.render.com), create a new **Web Service** connected to your repo.
3. Configure the service:
   * **Root Directory:** `backend`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
4. Add the following Environment Variables in Render:
   * `NODE_ENV`: `production`
   * `JWT_SECRET`: *(A secure random 64-character secret)*
   * `SUPER_ADMIN_EMAIL`: `gadekuldeep26@gmail.com`
   * `SUPER_ADMIN_PASSWORD`: `Password@123`
   * `SUPER_ADMIN_NAME`: `Kuldeep Gade`
   * `SUPER_ADMIN_MOBILE`: `919309381367`

### Deploying Frontend to Vercel
1. In the [Vercel Dashboard](https://vercel.com), import your `Scrims` repository.
2. Configure project settings:
   * **Root Directory:** `frontend`
   * **Framework Preset:** `Vite`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
3. Add Environment Variables in Vercel:
   * `VITE_API_URL`: `https://your-render-service.onrender.com/api`
   * `VITE_SOCKET_URL`: `https://your-render-service.onrender.com`

---

## 📜 License

This project is proprietary software developed for high-tier esports tournament management. All rights reserved.
