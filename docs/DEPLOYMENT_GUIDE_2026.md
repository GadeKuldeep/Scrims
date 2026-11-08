# 🚀 SCRIMS Platform — Production Deployment Guide
**Document Date:** November 7, 2026 (7-11-2026)  
**Target Environments:** Vercel (Frontend Client) & Render (Backend Node/Socket.IO Service)  
**Author:** SCRIMS Architectural Core

---

## 1. Architecture & Deployment Topology

```
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│        VERCEL (FRONTEND)        │                 │        RENDER (BACKEND)         │
│  React 19 + Vite 8 + Three.js   │  HTTPS API /    │  Node.js + Express 5 + SocketIO │
│  SPA Routing (vercel.json)      │  WSS WebSockets │  Real-Time 15s Hold Engine      │
│  https://your-scrims.vercel.app ├────────────────►│  https://your-api.onrender.com │
└─────────────────────────────────┘                 └──────────────┬──────────────────┘
                                                                   │
                                                                   ▼
                                                    ┌─────────────────────────────────┐
                                                    │       SUPABASE POSTGRESQL       │
                                                    │  schema.sql + seed_data.sql     │
                                                    │  (Or Zero-Config ACID Store)    │
                                                    └─────────────────────────────────┘
```

---

## 2. Pre-Flight Checklist

Before starting deployment, confirm you have:
1. A **GitHub repository** containing the `Scrims` workspace pushed to `main`.
2. A **Render account** ([render.com](https://render.com)).
3. A **Vercel account** ([vercel.com](https://vercel.com)).
4. *(Optional but recommended)* A **Supabase project** ([supabase.com](https://supabase.com)) if you wish to persist to cloud PostgreSQL instead of the zero-config in-memory ACID store.

---

## 3. Step 1: Deploy Backend to Render

Render will host the Express API and the persistent Socket.IO WebSocket server with the automatic 10-minute slot hold expiration background worker.

### Option A: Using the Included Blueprint (`render.yaml`) — Fastest
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Blueprint**.
3. Select your connected GitHub repository.
4. Render will automatically detect `render.yaml` and configure:
   - **Service Name:** `scrims-backend`
   - **Runtime:** `Node`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Health Check Path:** `/api/health`
5. Click **Apply**.

### Option B: Manual Web Service Setup
1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure the following fields:
   | Setting | Value |
   | :--- | :--- |
   | **Name** | `scrims-backend` (or your preferred name) |
   | **Region** | `Singapore` (Recommended for low-latency Indian gaming) or `Oregon` |
   | **Branch** | `main` |
   | **Root Directory** | `backend` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `node src/server.js` |
   | **Instance Type** | `Free` (or Starter for 24/7 zero cold-start) |

4. Scroll down to **Health Check Path** under **Advanced**:
   - Set **Health Check Path** to: `/api/health`

5. Add **Environment Variables** in Render:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production optimizations |
   | `PORT` | `10000` | Port automatically assigned by Render |
   | `JWT_SECRET` | `scrims_super_secure_jwt_secret_esports_2026_xyz` | Random 32+ character secret string |
   | `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
   | `FRONTEND_URL` | `*` *(or your Vercel URL once deployed)* | Allowed CORS origin |
   | `SUPABASE_URL` | *(Optional)* `https://your-proj.supabase.co` | Cloud PostgreSQL URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | *(Optional)* `sb_secret_...` | Supabase Service Role Key |

6. Click **Deploy Web Service**.
7. Once deployed, note down your Render Web Service URL:
   - Example: `https://scrims-backend.onrender.com`
   - Verify health by opening `https://scrims-backend.onrender.com/api/health` in your browser. You should receive:
     ```json
     {
       "status": "ONLINE",
       "service": "SCRIMS Esports Tournament Management API",
       "cluster": "Asia-S1",
       "version": "2.4.0"
     }
     ```

---

## 4. Step 2: Deploy Frontend to Vercel

Vercel will host the React 19 + Vite client with client-side SPA routing (`vercel.json`), WebGL 3D trophy rendering, and CDN caching.

### Step-by-Step Vercel Deployment:
1. Log in to [Vercel](https://vercel.com/dashboard).
2. Click **Add New...** → **Project**.
3. Select your GitHub repository and click **Import**.
4. In the **Configure Project** screen:
   - **Project Name:** `scrims` (or your preferred name)
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and select `frontend` (Important!).
   - **Build Command:** `npm run build` (Default)
   - **Output Directory:** `dist` (Default)
   - **Install Command:** `npm install` (Default)

5. Expand **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://scrims-backend.onrender.com/api` *(replace with your Render URL)* |
   | `VITE_SOCKET_URL` | `https://scrims-backend.onrender.com` *(replace with your Render URL)* |

   > **Note:** The updated `frontend/src/services/api.js` and `frontend/src/services/socket.js` automatically normalize URLs, so whether you include `/api` or not, both HTTP requests and Socket.IO WebSockets connect without error.

6. Click **Deploy**.
7. Vercel will build the production bundle (`dist/`) in ~40 seconds.
8. Once complete, click **Go to Dashboard** and note your public domain:
   - Example: `https://scrims-platform.vercel.app`

---

## 5. Step 3: Link Backend CORS (Optional Best Practice)

Once you have your Vercel URL (e.g. `https://scrims-platform.vercel.app`):
1. Go back to your **Render Dashboard** → `scrims-backend` → **Environment**.
2. Update `FRONTEND_URL`:
   - Change `*` to `https://scrims-platform.vercel.app`
3. Click **Save Changes**. Render will automatically re-deploy in ~10 seconds.

---

## 6. Step 4: First Production Super Admin Login

Your production instance is seeded exclusively with the single Super Admin account:
- **Name:** `Kuldeep Gade`
- **Email:** `gadekuldeep26@gmail.com`
- **Mobile:** `+919309381367` (or `919309381367`)
- **Password:** `Password@123`

### Verification Steps:
1. Open your live Vercel URL (e.g., `https://scrims-platform.vercel.app`).
2. Verify the 3D Championship Trophy renders in gleaming 24K gold with studio lights and floating celebration embers.
3. Click **Super Admin Access** in the top navigation or go to `/login`.
4. Enter `gadekuldeep26@gmail.com` (or `919309381367`) and `Password@123`.
5. You will be redirected to the **Super Admin Command Desk** (`/admin`).
6. Click **+ Schedule Tournament**:
   - Title: `BGMI Master Championship Season 1`
   - Game: `Battlegrounds Mobile India`
   - Start Time: `09:00 PM IST`
   - End Time: `11:00 PM IST`
   - Entry Fee: `1200`
7. Click **Create Tournament Protocol**.
8. Navigate back to the home page (`/`) — your new tournament will immediately appear live in the circuit grid with capacity telemetry, prize distribution, and slot reservation flow active!

---

## 7. Troubleshooting & FAQ

### Q1: Vercel shows 404 on page refresh (e.g. at `/admin` or `/tournaments`)
- **Fix:** Both `frontend/vercel.json` and root `vercel.json` include SPA rewrite rules:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
  Ensure `frontend` is set as your **Root Directory** in Vercel project settings.

### Q2: WebSocket connection fails or stays polling
- **Fix:** Verify `VITE_SOCKET_URL` in Vercel points to `https://your-backend.onrender.com` (without `/api`). The `socket.js` client is pre-configured with `['websocket', 'polling']` fallbacks.

### Q3: Render Free Tier Cold Starts
- **Fix:** On Render's free tier, servers go to sleep after 15 minutes of inactivity. The first request after a sleep period may take ~30–50 seconds to boot. To keep it awake 24/7 without paying, you can ping your `/api/health` endpoint every 10 minutes using a free uptime monitor (e.g., [UptimeRobot](https://uptimerobot.com/)).

---

*Guide verified and tested for production deployment on November 7, 2026.*
