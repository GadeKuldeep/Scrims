# SCRIMS Roles & Permission Matrix

The SCRIMS platform implements server-side, role-based access control (RBAC) across five specialized roles. Client-supplied role headers are never trusted; all authorization checks execute in Express middleware validating verified JWT claims.

---

## 1. Role Capabilities Matrix

| Feature / Action | PLAYER | TEAM_LEADER | MATCH_MASTER | SCORE_MASTER | SUPER_ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Public Circuit Browsing** | Yes | Yes | Yes | Yes | Yes |
| **Reserve / Hold Slot (10-min)** | Yes | Yes | No | No | Yes |
| **Submit Payment UTR & Receipt**| Yes | Yes | No | No | Yes |
| **View Booking History** | Own | Team | Assigned | Assigned | Global |
| **Create & Manage Team Roster** | Member | Leader | Read-only | Read-only | Global |
| **Invite / Remove Team Players** | No | Yes (pre-lock) | No | No | Global |
| **Verify Payment (Confirm/Reject)**| No | No | Assigned Tourneys | No | Global |
| **Manage Slots (Lock/Release)** | No | No | Assigned Tourneys | No | Global |
| **Send Official Match Announcements** | No | No | Assigned Tourneys | No | Global |
| **WhatsApp Match Coordination** | Outgoing | Outgoing | Incoming / Direct | No | Direct |
| **Submit Map Kills & Placements**| No | No | No | Assigned Tourneys | Global |
| **View Scoring Audit Ledger** | Public Standings | Public Standings | Read-only | Full Audit Log | Full Audit Log |
| **View Room Credentials (ID/Pass)**| Confirmed Only | Confirmed Only | Always | Always | Always |
| **Emergency Platform Freeze** | No | No | No | No | Yes |
| **Assign Match/Score Masters** | No | No | No | No | Yes |
| **Financial Reconciliations** | No | No | Assigned Verified | No | Global Gross/Net |

---

## 2. Role Profiles & Restrictions

### PLAYER
- **Capabilities:** Registers account, sets gaming handle, browses tournaments across BGMI, Free Fire, and Clash of Clans, holds slots, triggers WhatsApp coordination, submits UTR references, views payment status, accesses chat, and views live scoreboards.
- **Restrictions:** Cannot confirm their own booking, cannot view custom room credentials before 100% capacity lock, cannot alter scores, and cannot view other players' private financial information.

### TEAM_LEADER
- **Capabilities:** All player capabilities, plus creates and edits team profiles, manages 4-player competitive rosters, invites players, and submits squad bookings under their team identity.
- **Restrictions:** Roster modifications are blocked once a tournament registration enters LOCKED status.

### MATCH_MASTER
- **Capabilities:** Operational marshall assigned to specific tournaments. Reviews external payments coordinated via WhatsApp, audits UTR transaction hashes, approves or rejects bookings (with mandatory documented rejection reason), manages slot releases, and broadcasts room announcements.
- **Restrictions:** Cannot modify tournament scores, cannot reassign administrative roles, and cannot manage tournaments outside their assigned purview.

### SCORE_MASTER
- **Capabilities:** Telemetry operator assigned to specific matches. Rapid-inputs kills and placement positions across all 4 maps (Erangel, Livik, Rondo, Miramar), views real-time points calculations, and inspects immutable scoring revision history.
- **Restrictions:** Cannot verify payments, alter bookings, or reassign match credentials.

### SUPER_ADMIN
- **Capabilities:** Full platform sovereignty. Manages platform telemetry, schedules tournaments (enforcing 11:00 AM - 11:00 PM IST operational window), assigns Match and Score Masters to matches, issues emergency platform freezes, manages user roles, and audits gross financial entry collections against expected capacity figures (BGMI: ₹19,200, Free Fire: ₹9,600, Clash of Clans: ₹2,400).
- **Restrictions:** Cannot be created via public self-registration.
