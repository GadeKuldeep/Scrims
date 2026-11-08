# SCRIMS Architecture & Technical Design

## 1. System Overview

**SCRIMS** is a precision-engineered, full-stack esports tournament management and automated coordination platform built for competitive mobile gaming circuits in India (BGMI, Free Fire MAX, and Clash of Clans).

Unlike generic event dashboards, SCRIMS solves the operational bottlenecks of grassroots and semi-pro scrims:
- Concurrency-safe slot booking with automatic 10-minute hold expirations.
- Strict anti-tamper capacity enforcement (Room credentials unlock only when confirmed capacity is 100% full).
- Indian Standard Time (IST) hourly tournament scheduling between 11:00 AM and 11:00 PM IST.
- Manual payment reconciliation workflow via WhatsApp click-to-chat and UTR submission (no integrated payment gateway dependencies).
- Real-time 4-map telemetry scoring (Erangel, Livik, Rondo, Miramar) with immutable audit history logs.
- Real-time tournament room chat with live announcement broadcasts and role badges.

```
                      +-----------------------------+
                      |     React + Vite Client     |
                      |  (Space Grotesk / Tailwind) |
                      +--------------+--------------+
                                     |
                     HTTPS / REST    |   WebSockets (Socket.IO)
                                     v
                      +-----------------------------+
                      |     Node.js + Express.js    |
                      |  - JWT & Supabase Auth RBAC |
                      |  - 10-Min Mutex Hold Engine |
                      |  - Payment Marshall Audit   |
                      |  - 4-Map Telemetry Scoring  |
                      |  - Real-Time Broadcast Wire |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |      Persistence Layer      |
                      |  - Dual Mode Architecture   |
                      |  - Supabase PostgreSQL / RLS|
                      |  - ACID In-Memory Fast Cache|
                      +-----------------------------+
```

---

## 2. Core Operational State Machines

### A. Slot Reservation & Hold Lifecycle
```
[AVAILABLE] 
     │
     │  Player calls POST /api/bookings/hold
     ▼
  [HELD] (10-minute temporary mutex lock, countdown timer initiated)
     ├── (Player or MM submits UTR) ──> [PENDING_VERIFICATION]
     └── (Timer reaches 10:00:00) ────> [EXPIRED] ──> [AVAILABLE]
     
[PENDING_VERIFICATION]
     ├── Match Master reviews WhatsApp receipt & UTR
     │     │
     │     ├── Approves ──> [CONFIRMED] (Slot marked BOOKED, persistent roster locked)
     │     │
     │     └── Rejects  ──> [REJECTED] (Mandatory reason required, Slot reset to AVAILABLE)
```

### B. Tournament Room Unlock Gate
Room access and server credentials (Custom Room ID & Password) are strictly guarded on the backend.
- **BGMI Target:** 16 Squads (Full capacity = 16 confirmed bookings).
- **Free Fire Target:** 12 Squads (Full capacity = 12 confirmed bookings).
- **Clash of Clans Target:** 2 Participants (Full capacity = 2 confirmed bookings).

The endpoint `GET /api/tournaments/:id/credentials` inspects:
1. Is current user authenticated with role `MATCH_MASTER`, `SCORE_MASTER`, or `SUPER_ADMIN`? -> **UNLOCKED IMMEDIATELY**.
2. Or is current user a confirmed participant in this tournament AND does `confirmedCount >= maxSlots`? -> **UNLOCKED**.
3. Otherwise -> **403 FORBIDDEN** with explicit status payload (`status: "LOCKED"`, `confirmedCount`, `maxSlots`, `message: "Room locked until all 16 slots are confirmed"`).

---

## 3. Real-Time Telemetry & WebSocket Protocol

Real-time capabilities are orchestrated over Socket.IO with JWT handshake authentication:

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join:tournament` | Client -> Server | `{ tournamentId }` | Joins isolated room channel for the tournament |
| `leave:tournament` | Client -> Server | `{ tournamentId }` | Leaves room channel |
| `slot:held` | Server -> Clients | `{ slot_number, booking_id, expires_at }` | Real-time visual lock across all users browsing grid |
| `slot:released` | Server -> Clients | `{ slot_number }` | Real-time release when hold expires or booking is rejected |
| `slot:confirmed` | Server -> Clients | `{ slot_number, team_name }` | Real-time confirmation badge update |
| `scores:updated` | Server -> Clients | `{ map_name, scores, aggregate }` | Instant scoreboard recalculation and animation |
| `chat:message` | Client <-> Server | `{ text, is_announcement }` | Real-time player and staff communication |
| `tournament:announcement` | Server -> Clients | `{ text, author, timestamp }` | High-priority sticky banner in room |

---

## 4. Scoring Engine Architecture

The BGMI scoring calculation strictly executes:
$$\text{Total Points} = \text{Kill Points} (1 \text{ pt/kill}) + \text{Placement Points}$$

Placement point matrix:
- **1st Place (Winner Winner Chicken Dinner):** 10 points
- **2nd Place:** 6 points
- **3rd Place:** 2 points
- **4th - 16th Place:** 0 points

Scores are captured map-by-map across:
1. Erangel (Map 1)
2. Livik (Map 2)
3. Rondo (Map 3)
4. Miramar (Map 4)

Cumulative leaderboard aggregates all 4 maps, breaking ties by:
1. Highest total placement points
2. Highest total kill points
3. Best single-map finish
