-- ====================================================================
-- SCRIMS Full-Stack Esports Tournament Platform
-- Migration: 001_initial_schema.sql
-- Description: Core relational schema, indexes, constraints & triggers
-- ====================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table (Extends Supabase auth.users or standalone auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    avatar_url TEXT DEFAULT '',
    in_game_id VARCHAR(50) DEFAULT '',
    role VARCHAR(30) NOT NULL DEFAULT 'PLAYER' 
        CHECK (role IN ('PLAYER', 'TEAM_LEADER', 'MATCH_MASTER', 'SCORE_MASTER', 'SUPER_ADMIN')),
    staff_code VARCHAR(30) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 2. Games Configuration Table
CREATE TABLE IF NOT EXISTS games (
    id VARCHAR(50) PRIMARY KEY, -- 'bgmi', 'freefire', 'clashofclans'
    title VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    banner_url TEXT,
    max_slots INTEGER NOT NULL DEFAULT 16,
    entry_fee NUMERIC(10, 2) NOT NULL DEFAULT 1200.00,
    expected_gross_entry NUMERIC(10, 2) NOT NULL DEFAULT 19200.00,
    maps JSONB DEFAULT '[]'::jsonb,
    scoring_rules JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    tag VARCHAR(10) NOT NULL,
    logo_url TEXT DEFAULT '',
    leader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    bio TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_leader ON teams(leader_id);

-- 4. Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL DEFAULT 'MEMBER' 
        CHECK (role IN ('LEADER', 'IGL', 'ASSAULTER', 'SNIPER', 'SUPPORT', 'SUBSTITUTE', 'MEMBER')),
    in_game_id VARCHAR(50) DEFAULT '',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

-- 5. Team Invitations Table
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    invited_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invited_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_invites_user ON team_invitations(invited_user_id, status);

-- 6. Tournaments Table
CREATE TABLE IF NOT EXISTS tournaments (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'BGMI-2100'
    title VARCHAR(150) NOT NULL,
    game_id VARCHAR(50) NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
    description TEXT,
    banner_url TEXT,
    entry_fee NUMERIC(10, 2) NOT NULL DEFAULT 1200.00,
    max_participants INTEGER NOT NULL DEFAULT 16,
    registration_opening_date TIMESTAMPTZ NOT NULL,
    registration_closing_date TIMESTAMPTZ NOT NULL,
    tournament_date DATE NOT NULL,
    start_time_ist VARCHAR(20) NOT NULL, -- e.g. '09:00 PM IST'
    end_time_ist VARCHAR(20) NOT NULL,   -- e.g. '11:00 PM IST'
    status VARCHAR(30) NOT NULL DEFAULT 'REGISTRATION_OPEN'
        CHECK (status IN ('DRAFT', 'UPCOMING', 'REGISTRATION_OPEN', 'FULL', 'ONGOING', 'COMPLETED', 'CANCELLED')),
    room_id VARCHAR(50) DEFAULT NULL,
    room_password VARCHAR(50) DEFAULT NULL,
    is_room_unlocked BOOLEAN DEFAULT FALSE,
    rules TEXT,
    scoring_config JSONB DEFAULT '{}'::jsonb,
    assigned_match_master_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_score_master_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournaments_game ON tournaments(game_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_mm ON tournaments(assigned_match_master_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_sm ON tournaments(assigned_score_master_id);

-- 7. Matches (Map Schedule within a Tournament)
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id VARCHAR(50) NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    match_number INTEGER NOT NULL,
    map_name VARCHAR(50) NOT NULL, -- 'Erangel', 'Livik', 'Rondo', 'Miramar'
    scheduled_start_ist VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED'
        CHECK (status IN ('SCHEDULED', 'WARMUP', 'LIVE', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);

-- 8. Bookings Table (Pre-declarative to allow slot references)
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'SCRIM-BGMI-749210'
    tournament_id VARCHAR(50) NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    slot_number INTEGER NOT NULL CHECK (slot_number >= 1),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team_name VARCHAR(100) NOT NULL,
    entry_fee NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED'
        CHECK (status IN ('REQUESTED', 'PAYMENT_PENDING', 'UNDER_VERIFICATION', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'EXPIRED')),
    hold_expires_at TIMESTAMPTZ NOT NULL,
    whatsapp_message TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tourn_slot ON bookings(tournament_id, slot_number);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- 9. Slots Table (Concurrency-safe slot state)
CREATE TABLE IF NOT EXISTS slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id VARCHAR(50) NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    slot_number INTEGER NOT NULL CHECK (slot_number >= 1),
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'HELD', 'BOOKED')),
    held_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    held_until TIMESTAMPTZ DEFAULT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tournament_id, slot_number)
);

CREATE INDEX IF NOT EXISTS idx_slots_tourn_status ON slots(tournament_id, status);

-- 10. Manual Payment Verification Records Table
CREATE TABLE IF NOT EXISTS payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'UPI', -- 'UPI / GPay', 'PhonePe', 'Paytm', 'IMPS'
    transaction_reference VARCHAR(100) NOT NULL,       -- External UTR / Txn ID submitted by player
    screenshot_url TEXT DEFAULT '',
    verification_status VARCHAR(30) NOT NULL DEFAULT 'UNDER_VERIFICATION'
        CHECK (verification_status IN ('PENDING', 'UNDER_VERIFICATION', 'VERIFIED', 'REJECTED')),
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ DEFAULT NULL,
    rejection_reason TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payment_records(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_records(verification_status);

-- 11. Confirmed Tournament Participants Table
CREATE TABLE IF NOT EXISTS tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id VARCHAR(50) NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    slot_number INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team_name VARCHAR(100) NOT NULL,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, slot_number),
    UNIQUE(tournament_id, booking_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_tourn ON tournament_participants(tournament_id);

-- 12. Real-Time Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id VARCHAR(50) NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    user_role VARCHAR(30) NOT NULL,
    avatar_url TEXT DEFAULT '',
    message TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'CHAT'
        CHECK (message_type IN ('CHAT', 'ANNOUNCEMENT', 'SYSTEM')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_tourn ON chat_messages(tournament_id, created_at);

-- 13. Map Scores Table
CREATE TABLE IF NOT EXISTS map_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id VARCHAR(50) NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    map_name VARCHAR(50) NOT NULL, -- 'Erangel', 'Livik', 'Rondo', 'Miramar'
    slot_number INTEGER NOT NULL,
    squad_name VARCHAR(100) NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    kills INTEGER NOT NULL DEFAULT 0 CHECK (kills >= 0),
    kill_points INTEGER NOT NULL DEFAULT 0 CHECK (kill_points >= 0),
    placement INTEGER NOT NULL DEFAULT 0 CHECK (placement >= 0 AND placement <= 16),
    placement_points INTEGER NOT NULL DEFAULT 0 CHECK (placement_points >= 0),
    total_points INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
    entered_by_score_master_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tournament_id, map_name, slot_number)
);

CREATE INDEX IF NOT EXISTS idx_map_scores_tourn ON map_scores(tournament_id, map_name);

-- 14. Score Modification Audit History Table
CREATE TABLE IF NOT EXISTS score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id VARCHAR(50) NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    map_name VARCHAR(50) NOT NULL,
    slot_number INTEGER NOT NULL,
    squad_name VARCHAR(100) NOT NULL,
    previous_value JSONB NOT NULL,
    new_value JSONB NOT NULL,
    change_summary TEXT NOT NULL,
    reason TEXT NOT NULL,
    score_master_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    score_master_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_score_hist_tourn ON score_history(tournament_id);

-- 15. In-App Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(40) NOT NULL,
    reference_id VARCHAR(100) DEFAULT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- 16. Audit Logs Table (Platform-wide privileged actions)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_role VARCHAR(30) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
