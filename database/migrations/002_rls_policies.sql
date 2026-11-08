-- ====================================================================
-- SCRIMS Full-Stack Esports Tournament Platform
-- Migration: 002_rls_policies.sql
-- Description: Row Level Security (RLS) policies for Supabase PostgreSQL
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is Super Admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile except role" 
ON profiles FOR UPDATE USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  role = (SELECT role FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Super Admins can manage all profiles" 
ON profiles FOR ALL USING (is_super_admin());

-- 2. Games Policies
CREATE POLICY "Games viewable by everyone" 
ON games FOR SELECT USING (true);

CREATE POLICY "Only Super Admins can modify games" 
ON games FOR ALL USING (is_super_admin());

-- 3. Teams Policies
CREATE POLICY "Teams viewable by everyone" 
ON teams FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create teams" 
ON teams FOR INSERT WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Team Leaders can update their team" 
ON teams FOR UPDATE USING (auth.uid() = leader_id);

-- 4. Team Members Policies
CREATE POLICY "Team members viewable by everyone" 
ON team_members FOR SELECT USING (true);

CREATE POLICY "Team Leader or user can manage team members" 
ON team_members FOR ALL USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM teams WHERE id = team_members.team_id AND leader_id = auth.uid()) OR
  is_super_admin()
);

-- 5. Tournaments Policies
CREATE POLICY "Published tournaments are viewable by everyone" 
ON tournaments FOR SELECT USING (
  status != 'DRAFT' OR 
  auth.uid() = assigned_match_master_id OR 
  auth.uid() = assigned_score_master_id OR 
  is_super_admin()
);

CREATE POLICY "Staff and Admins can update assigned tournaments" 
ON tournaments FOR UPDATE USING (
  auth.uid() = assigned_match_master_id OR 
  auth.uid() = assigned_score_master_id OR 
  is_super_admin()
);

-- 6. Matches Policies
CREATE POLICY "Matches viewable by everyone" 
ON matches FOR SELECT USING (true);

-- 7. Slots Policies
CREATE POLICY "Slots viewable by everyone" 
ON slots FOR SELECT USING (true);

-- 8. Bookings Policies
CREATE POLICY "Users can view own bookings" 
ON bookings FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM tournaments t 
    WHERE t.id = bookings.tournament_id AND (t.assigned_match_master_id = auth.uid() OR is_super_admin())
  )
);

CREATE POLICY "Authenticated users can create booking requests" 
ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. Payment Records Policies
CREATE POLICY "Users can view payment records for their bookings" 
ON payment_records FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.id = payment_records.booking_id AND (
      b.user_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM tournaments t 
        WHERE t.id = b.tournament_id AND (t.assigned_match_master_id = auth.uid() OR is_super_admin())
      )
    )
  )
);

-- 10. Chat Messages Policies
CREATE POLICY "Confirmed participants and staff can read chat" 
ON chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tournament_participants tp 
    WHERE tp.tournament_id = chat_messages.tournament_id AND tp.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM tournaments t 
    WHERE t.id = chat_messages.tournament_id AND (
      t.assigned_match_master_id = auth.uid() OR 
      t.assigned_score_master_id = auth.uid() OR 
      is_super_admin()
    )
  )
);

CREATE POLICY "Authorized participants and staff can send chat" 
ON chat_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (
      SELECT 1 FROM tournament_participants tp 
      WHERE tp.tournament_id = chat_messages.tournament_id AND tp.user_id = auth.uid()
    ) OR 
    EXISTS (
      SELECT 1 FROM tournaments t 
      WHERE t.id = chat_messages.tournament_id AND (
        t.assigned_match_master_id = auth.uid() OR 
        t.assigned_score_master_id = auth.uid() OR 
        is_super_admin()
      )
    )
  )
);

-- 11. Map Scores Policies
CREATE POLICY "Scores are publicly viewable" 
ON map_scores FOR SELECT USING (true);

CREATE POLICY "Only assigned Score Master and Super Admin can enter scores" 
ON map_scores FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tournaments t 
    WHERE t.id = map_scores.tournament_id AND (t.assigned_score_master_id = auth.uid() OR is_super_admin())
  )
);

-- 12. Score History Policies
CREATE POLICY "Score history is viewable by participants and staff" 
ON score_history FOR SELECT USING (true);

-- 13. Notifications Policies
CREATE POLICY "Users can view and manage their own notifications" 
ON notifications FOR ALL USING (auth.uid() = user_id);

-- 14. Audit Logs Policies
CREATE POLICY "Only Super Admins can access audit logs" 
ON audit_logs FOR ALL USING (is_super_admin());
