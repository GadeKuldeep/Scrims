# SCRIMS REST API Specification

Base URL: `http://localhost:5000/api` (or proxied via `/api` on frontend)

All authenticated endpoints require an `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
Creates a new Player or Team Leader account.
- **Body:**
  ```json
  {
    "email": "player@scrims.gg",
    "password": "Password123!",
    "full_name": "Ajay Sharma",
    "username": "VortexStriker",
    "mobile_number": "9876543210",
    "game_uid": "5123456789",
    "role": "PLAYER"
  }
  ```
- **Response:** `201 Created` with user profile and JWT token.

### `POST /api/auth/login`
Authenticates existing user.
- **Body:**
  ```json
  {
    "email": "player@scrims.gg",
    "password": "Password123!"
  }
  ```
- **Response:** `200 OK` with user profile and JWT token.

### `GET /api/auth/me`
Retrieves currently authenticated user context.
- **Response:** `200 OK` with profile object.

---

## 2. Tournaments (`/api/tournaments`)

### `GET /api/tournaments`
Lists active tournaments with live slot status, IST schedules, and game modes.
- **Query Params:** `?game=bgmi|freefire|coc&status=upcoming|ongoing|completed`

### `GET /api/tournaments/:id`
Retrieves detailed tournament record including map schedules, assigned marshalls, and confirmed squads.

### `GET /api/tournaments/:id/slots`
Returns the complete grid of slots (1 to 16 for BGMI) with current status (`AVAILABLE`, `HELD`, `BOOKED`, `LOCKED`), held expiration timestamps, and booked team names.

### `GET /api/tournaments/:id/credentials`
Retrieves private room credentials (Room ID & Password).
- **Security Logic:** Unlocks only if user is Staff (`MATCH_MASTER`, `SCORE_MASTER`, `SUPER_ADMIN`) OR a confirmed participant with 100% capacity filled. Otherwise returns `403 Forbidden` with locked status.

---

## 3. Slot Booking & Concurrency (`/api/bookings`)

### `POST /api/bookings/hold`
Places a 10-minute temporary concurrency mutex hold on an available slot.
- **Body:**
  ```json
  {
    "tournament_id": "BGMI-2100",
    "slot_number": 4,
    "team_name": "GodLike Esports",
    "contact_phone": "9876543210"
  }
  ```
- **Response:** `201 Created` with `booking_id`, `expires_at`, unique `booking_reference` (`SCRIM-BGMI-XXXXXX`), and pre-filled WhatsApp click-to-chat URL.

### `POST /api/bookings/:id/submit-payment`
Submits transaction UTR reference and payment confirmation details.
- **Body:**
  ```json
  {
    "utr_number": "UTR-2026-998811",
    "payment_method": "UPI / GPay"
  }
  ```
- **Response:** `200 OK` with status transitioned to `PENDING_VERIFICATION`.

---

## 4. Payment Marshalling (`/api/payments`)

### `GET /api/payments`
Lists payment verification requests for assigned Match Master or Super Admin.
- **Query Params:** `?status=pending|verified|rejected`

### `POST /api/payments/:id/verify`
Confirms payment received, marks booking `CONFIRMED`, marks slot `BOOKED`, locks roster, and notifies player.
- **Body:**
  ```json
  {
    "notes": "Verified receipt on WhatsApp matching UPI UTR"
  }
  ```

### `POST /api/payments/:id/reject`
Rejects payment request. Mandatory rejection reason required. Resets slot back to `AVAILABLE`.
- **Body:**
  ```json
  {
    "rejection_reason": "Invalid transaction screenshot. UTR not found."
  }
  ```

---

## 5. Scoring & Standings (`/api/scores`)

### `GET /api/scores/:tournamentId`
Returns map-wise scores (Erangel, Livik, Rondo, Miramar) and live aggregate leaderboard computed with BGMI formula:
$$\text{Total Points} = \text{Kill Points} (1\text{ pt}) + \text{Placement Points } (10/6/2/0)$$

### `POST /api/scores/:tournamentId/update`
Allows assigned Score Master or Super Admin to record map results.
- **Body:**
  ```json
  {
    "map_name": "Erangel",
    "team_id": "team-001",
    "slot_number": 1,
    "kills": 12,
    "placement": 1
  }
  ```
- **Audit:** Automatically logs timestamp, previous values, new values, and operator user ID into immutable `score_history` table.

---

## 6. Real-Time Chat & Announcements (`/api/chat`)

### `GET /api/chat/:tournamentId`
Returns recent chat messages with user avatars and role badges.

### `POST /api/chat/:tournamentId`
Sends a chat message or high-priority announcement (Match Master / Super Admin only).
- **Body:**
  ```json
  {
    "message": "Erangel lobby opens in 5 minutes. Check room credentials tab.",
    "is_announcement": true
  }
  ```
