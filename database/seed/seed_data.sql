-- ====================================================================
-- SCRIMS Full-Stack Esports Tournament Platform
-- Seed Data: seed_data.sql
-- Description: Test users (5 roles), Games, Tournaments, Slots, Scores
-- ====================================================================

-- 1. Insert Games Configuration
INSERT INTO games (id, title, slug, description, banner_url, max_slots, entry_fee, expected_gross_entry, maps, scoring_rules)
VALUES 
(
    'bgmi', 
    'Battlegrounds Mobile India', 
    'bgmi', 
    'Official BGMI Tier-1 and Tier-2 4-Map Championship Scrims with hourly sessions.', 
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ0NUbJK4B0tfqDvwN_9J0cCam8-AI9SCdvQPEXpU1Qwf37U3Wn2hi120mxf-b9tU43-O2pFEUboRzkuKUIs1ryuLMtMW1RRTAaLpqRGdzwDqGQ0tthxPu54tAmhPd5G_f2AnwuBzJD76iXdEyiQRThQD2Q4u1V6gxZ6gsNEW53_NsStkDPnauf6GgoNQLM_3grdXb-kaluBsHkNlN6DGV7RmhZsp5q727e6P8phU', 
    16, 
    1200.00, 
    19200.00, 
    '["Erangel", "Livik", "Rondo", "Miramar"]'::jsonb, 
    '{"kill_point": 1, "placement": {"1": 10, "2": 6, "3": 2, "others": 0}, "tie_breakers": ["chicken_dinners", "total_kills", "placement_points"]}'::jsonb
),
(
    'freefire', 
    'Free Fire MAX', 
    'freefire', 
    'High-octane Free Fire squad scrims with 12-team tactical formats.', 
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDDUvAPR01AXu17sCEFbbWVYyVXCSJ6dKnfwnTaYx5OvbkrsYJXjBav3Fw7_0vQIiMLDDO6yK9XMq9TJ2WzIhhsdixRBDVunc2IJDduEGpdv61glpnTR3PdpZf-AjG9sOpVzYrBIy_aS1i2A4AELJZJp5a3Vr6xPh54xoMYwMMHkdxlwyqRockPwnUrYM0VTWyuCwUQoq2YGZEJKeK9AFSTZezYpDzPOT0d0n8V_UQ', 
    12, 
    800.00, 
    9600.00, 
    '["Bermuda", "Purgatory", "Kalahari"]'::jsonb, 
    '{"kill_point": 1, "placement": {"1": 12, "2": 9, "3": 8, "4": 7, "5": 6, "others": 0}, "tie_breakers": ["total_kills", "placement_points"]}'::jsonb
),
(
    'clashofclans', 
    'Clash of Clans War', 
    'clashofclans', 
    'Head-to-head 1v1 Town Hall competitive duel wars.', 
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBWT5Z1_aazZJVMhjuGLTSGxkBywHEBMvQvkNFNIcfmq5232ozqcpFzNYAiJZODccNOUAqEc5ie00Qnj8odfgwYLzMZg7CLyKUzogAy5PFKm0ucUKOcuVQ-zYne19KhPlJ0F_9FhbGGUAHwECGvJ6Tf9Ej3c_m_NvdPl0jDxaqkxZbPPeM7U-smTTKzrQXpxX2Hki7muQRwpuQZdXn7B9z2EZZGy0wdQLQEcECiU8E', 
    2, 
    1200.00, 
    2400.00, 
    '["War Base Alpha", "War Base Beta"]'::jsonb, 
    '{"star_points": 10, "destruction_percentage_points": 1}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    entry_fee = EXCLUDED.entry_fee,
    max_slots = EXCLUDED.max_slots,
    expected_gross_entry = EXCLUDED.expected_gross_entry;

-- 2. Seed Super Admin (Kuldeep Gade)
-- Password for Super Admin is: Password@123 (hashed with bcrypt 10 rounds: $2a$10$wJjLqHqE2XU6R2eN1C6b.e52Qo8vMlhL4c4tB7yI1l/mS5E0w1k.S)
INSERT INTO profiles (id, username, full_name, email, mobile_number, avatar_url, in_game_id, role, staff_code)
VALUES 
(
    'a0000000-0000-0000-0000-000000000001', 
    'kuldeep_gade', 
    'Kuldeep Gade', 
    'gadekuldeep26@gmail.com', 
    '+919309381367', 
    'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150', 
    'SUPERADMIN_01', 
    'SUPER_ADMIN', 
    'ROOT-001'
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    mobile_number = EXCLUDED.mobile_number,
    role = EXCLUDED.role;
