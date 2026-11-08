import { createClient } from '@supabase/supabase-js';
import { ENV } from './env.js';
import { GAME_CONFIGS, ROLES, TOURNAMENT_STATUS, SLOT_STATUS, BOOKING_STATUS, PAYMENT_STATUS, SLOT_HOLD_DURATION_MINUTES } from './constants.js';
import bcrypt from 'bcryptjs';

// Initialize Supabase Client if credentials are provided
export let supabase = null;
if (ENV.SUPABASE_URL && ENV.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY);
    console.log('[Supabase] Initialized cloud client with service role authority.');
  } catch (err) {
    console.warn('[Supabase] Failed to initialize client, fallback active:', err.message);
  }
}

// -------------------------------------------------------------
// IN-MEMORY / LOCAL HIGH-CONCURRENCY STATE ENGINE
// Guarantees zero-config instant startup and reliable test execution
// -------------------------------------------------------------

const defaultPasswordHash = bcrypt.hashSync('Password@123', 10);

// Default Seed State — Single Super Admin only (Kuldeep Gade)
const memoryStore = {
  profiles: [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      username: 'kuldeep_gade',
      full_name: 'Kuldeep Gade',
      email: 'gadekuldeep26@gmail.com',
      password_hash: defaultPasswordHash,
      mobile_number: '+919309381367',
      avatar_url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
      in_game_id: 'SUPERADMIN_01',
      role: ROLES.SUPER_ADMIN,
      staff_code: 'ROOT-001',
      created_at: new Date('2026-01-01').toISOString(),
      updated_at: new Date('2026-01-01').toISOString()
    }
  ],

  games: Object.values(GAME_CONFIGS),
  teams: [],
  teamMembers: [],
  teamInvitations: [],
  tournaments: [],
  matches: [],
  slots: [],
  bookings: [],
  paymentRecords: [],
  tournamentParticipants: [],
  chatMessages: [],
  mapScores: [],
  scoreHistory: [],
  notifications: [],
  auditLogs: []
};

// -------------------------------------------------------------
// UNIFIED DATABASE ACCESS INTERFACE
// -------------------------------------------------------------

export const db = {
  // Profiles
  profiles: {
    findById: async (id) => {
      return memoryStore.profiles.find(p => p.id === id) || null;
    },
    findByEmail: async (email) => {
      return memoryStore.profiles.find(p => p.email.toLowerCase() === email.toLowerCase()) || null;
    },
    findByUsername: async (username) => {
      return memoryStore.profiles.find(p => p.username.toLowerCase() === username.toLowerCase()) || null;
    },
    findByMobile: async (mobile) => {
      if (!mobile) return null;
      const clean = mobile.replace(/[^0-9]/g, '');
      return memoryStore.profiles.find(p => p.mobile_number && p.mobile_number.replace(/[^0-9]/g, '') === clean) || null;
    },
    create: async (data) => {
      const newProfile = {
        id: data.id || `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        username: data.username,
        full_name: data.full_name,
        email: data.email.toLowerCase(),
        password_hash: data.password_hash,
        mobile_number: data.mobile_number,
        avatar_url: data.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        in_game_id: data.in_game_id || '',
        role: data.role || ROLES.PLAYER,
        staff_code: data.staff_code || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      memoryStore.profiles.push(newProfile);
      return newProfile;
    },
    update: async (id, updates) => {
      const idx = memoryStore.profiles.findIndex(p => p.id === id);
      if (idx === -1) return null;
      memoryStore.profiles[idx] = {
        ...memoryStore.profiles[idx],
        ...updates,
        updated_at: new Date().toISOString()
      };
      return memoryStore.profiles[idx];
    },
    getAll: async () => {
      return memoryStore.profiles.map(({ password_hash, ...rest }) => rest);
    }
  },

  // Games
  games: {
    getAll: async () => [...memoryStore.games],
    findById: async (id) => memoryStore.games.find(g => g.id === id) || null,
    update: async (id, updates) => {
      const idx = memoryStore.games.findIndex(g => g.id === id);
      if (idx === -1) return null;
      memoryStore.games[idx] = { ...memoryStore.games[idx], ...updates };
      return memoryStore.games[idx];
    }
  },

  // Tournaments
  tournaments: {
    getAll: async (filter = {}) => {
      return memoryStore.tournaments.filter(t => {
        if (filter.game_id && t.game_id !== filter.game_id) return false;
        if (filter.status && t.status !== filter.status) return false;
        if (filter.assigned_match_master_id && t.assigned_match_master_id !== filter.assigned_match_master_id) return false;
        if (filter.assigned_score_master_id && t.assigned_score_master_id !== filter.assigned_score_master_id) return false;
        return true;
      });
    },
    findById: async (id) => {
      return memoryStore.tournaments.find(t => t.id === id) || null;
    },
    create: async (data) => {
      const newT = {
        id: data.id || `TRN-${Date.now().toString().slice(-4)}`,
        title: data.title,
        game_id: data.game_id,
        description: data.description || '',
        banner_url: data.banner_url || '',
        entry_fee: Number(data.entry_fee) || 1200,
        max_participants: Number(data.max_participants) || 16,
        registration_opening_date: data.registration_opening_date || new Date().toISOString(),
        registration_closing_date: data.registration_closing_date || new Date(Date.now() + 86400000 * 2).toISOString(),
        tournament_date: data.tournament_date || new Date().toISOString().split('T')[0],
        start_time_ist: data.start_time_ist || '09:00 PM IST',
        end_time_ist: data.end_time_ist || '11:00 PM IST',
        status: data.status || TOURNAMENT_STATUS.REGISTRATION_OPEN,
        room_id: data.room_id || null,
        room_password: data.room_password || null,
        is_room_unlocked: false,
        rules: data.rules || '',
        scoring_config: data.scoring_config || (GAME_CONFIGS[data.game_id]?.scoring || {}),
        assigned_match_master_id: data.assigned_match_master_id || null,
        assigned_score_master_id: data.assigned_score_master_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      memoryStore.tournaments.push(newT);

      // Automatically initialize available slots
      for (let s = 1; s <= newT.max_participants; s++) {
        memoryStore.slots.push({
          id: `slot-${newT.id}-${s}`,
          tournament_id: newT.id,
          slot_number: s,
          status: SLOT_STATUS.AVAILABLE,
          held_by_user_id: null,
          held_until: null,
          booking_id: null,
          updated_at: new Date().toISOString()
        });
      }

      return newT;
    },
    update: async (id, updates) => {
      const idx = memoryStore.tournaments.findIndex(t => t.id === id);
      if (idx === -1) return null;
      memoryStore.tournaments[idx] = {
        ...memoryStore.tournaments[idx],
        ...updates,
        updated_at: new Date().toISOString()
      };
      return memoryStore.tournaments[idx];
    }
  },

  // Matches
  matches: {
    findByTournamentId: async (tournamentId) => {
      return memoryStore.matches.filter(m => m.tournament_id === tournamentId);
    },
    create: async (data) => {
      const m = {
        id: `match-${Date.now()}`,
        tournament_id: data.tournament_id,
        match_number: data.match_number,
        map_name: data.map_name,
        scheduled_start_ist: data.scheduled_start_ist,
        status: data.status || 'SCHEDULED',
        created_at: new Date().toISOString()
      };
      memoryStore.matches.push(m);
      return m;
    },
    update: async (id, updates) => {
      const idx = memoryStore.matches.findIndex(m => m.id === id);
      if (idx === -1) return null;
      memoryStore.matches[idx] = { ...memoryStore.matches[idx], ...updates };
      return memoryStore.matches[idx];
    }
  },

  // Teams
  teams: {
    findById: async (id) => memoryStore.teams.find(t => t.id === id) || null,
    findByName: async (name) => memoryStore.teams.find(t => t.name.toLowerCase() === name.toLowerCase()) || null,
    findByLeaderId: async (leaderId) => memoryStore.teams.find(t => t.leader_id === leaderId) || null,
    create: async (data) => {
      const newTeam = {
        id: `team-${Date.now()}`,
        name: data.name,
        tag: data.tag.toUpperCase(),
        logo_url: data.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        leader_id: data.leader_id,
        bio: data.bio || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      memoryStore.teams.push(newTeam);
      // Add leader to team_members
      memoryStore.teamMembers.push({
        id: `tm-${Date.now()}`,
        team_id: newTeam.id,
        user_id: data.leader_id,
        role: 'LEADER',
        in_game_id: data.in_game_id || '',
        joined_at: new Date().toISOString()
      });
      return newTeam;
    },
    update: async (id, updates) => {
      const idx = memoryStore.teams.findIndex(t => t.id === id);
      if (idx === -1) return null;
      memoryStore.teams[idx] = { ...memoryStore.teams[idx], ...updates, updated_at: new Date().toISOString() };
      return memoryStore.teams[idx];
    }
  },

  // Team Members
  teamMembers: {
    findByTeamId: async (teamId) => {
      const members = memoryStore.teamMembers.filter(tm => tm.team_id === teamId);
      return members.map(m => {
        const profile = memoryStore.profiles.find(p => p.id === m.user_id) || {};
        return {
          ...m,
          username: profile.username || 'Player',
          full_name: profile.full_name || '',
          avatar_url: profile.avatar_url || ''
        };
      });
    },
    findByUserId: async (userId) => {
      return memoryStore.teamMembers.find(tm => tm.user_id === userId) || null;
    },
    addMember: async (data) => {
      const tm = {
        id: `tm-${Date.now()}`,
        team_id: data.team_id,
        user_id: data.user_id,
        role: data.role || 'MEMBER',
        in_game_id: data.in_game_id || '',
        joined_at: new Date().toISOString()
      };
      memoryStore.teamMembers.push(tm);
      return tm;
    },
    removeMember: async (teamId, userId) => {
      const idx = memoryStore.teamMembers.findIndex(tm => tm.team_id === teamId && tm.user_id === userId);
      if (idx !== -1) {
        memoryStore.teamMembers.splice(idx, 1);
        return true;
      }
      return false;
    }
  },

  // Team Invitations
  teamInvitations: {
    findByUserId: async (userId) => {
      return memoryStore.teamInvitations.filter(ti => ti.invited_user_id === userId);
    },
    findByTeamId: async (teamId) => {
      return memoryStore.teamInvitations.filter(ti => ti.team_id === teamId);
    },
    create: async (data) => {
      const inv = {
        id: `inv-${Date.now()}`,
        team_id: data.team_id,
        invited_user_id: data.invited_user_id,
        invited_by_id: data.invited_by_id,
        status: 'PENDING',
        created_at: new Date().toISOString()
      };
      memoryStore.teamInvitations.push(inv);
      return inv;
    },
    update: async (id, updates) => {
      const idx = memoryStore.teamInvitations.findIndex(ti => ti.id === id);
      if (idx === -1) return null;
      memoryStore.teamInvitations[idx] = { ...memoryStore.teamInvitations[idx], ...updates };
      return memoryStore.teamInvitations[idx];
    }
  },

  // Slots (Concurrency-Safe Operations)
  slots: {
    findByTournamentId: async (tournamentId) => {
      // First release expired holds
      await db.slots.releaseExpiredHolds();
      return memoryStore.slots.filter(s => s.tournament_id === tournamentId);
    },
    reserveSlot: async (tournamentId, slotNumber, userId, holdMinutes = SLOT_HOLD_DURATION_MINUTES) => {
      // Concurrency check: Ensure slot is AVAILABLE or held by same user
      await db.slots.releaseExpiredHolds();
      const slot = memoryStore.slots.find(s => s.tournament_id === tournamentId && s.slot_number === slotNumber);
      if (!slot) {
        throw new Error(`Slot #${slotNumber} does not exist in tournament ${tournamentId}`);
      }
      if (slot.status === SLOT_STATUS.BOOKED) {
        throw new Error(`Slot #${slotNumber} is already confirmed and booked.`);
      }
      if (slot.status === SLOT_STATUS.HELD && slot.held_by_user_id !== userId) {
        throw new Error(`Slot #${slotNumber} is currently held by another player. Please select another slot.`);
      }

      const holdExpiresAt = new Date(Date.now() + holdMinutes * 60 * 1000).toISOString();
      slot.status = SLOT_STATUS.HELD;
      slot.held_by_user_id = userId;
      slot.held_until = holdExpiresAt;
      slot.updated_at = new Date().toISOString();

      return { slot, holdExpiresAt };
    },
    confirmSlot: async (tournamentId, slotNumber, bookingId) => {
      const slot = memoryStore.slots.find(s => s.tournament_id === tournamentId && s.slot_number === slotNumber);
      if (!slot) throw new Error('Slot not found');
      slot.status = SLOT_STATUS.BOOKED;
      slot.held_until = null;
      slot.booking_id = bookingId;
      slot.updated_at = new Date().toISOString();
      return slot;
    },
    releaseSlot: async (tournamentId, slotNumber) => {
      const slot = memoryStore.slots.find(s => s.tournament_id === tournamentId && s.slot_number === slotNumber);
      if (slot && slot.status !== SLOT_STATUS.BOOKED) {
        slot.status = SLOT_STATUS.AVAILABLE;
        slot.held_by_user_id = null;
        slot.held_until = null;
        slot.booking_id = null;
        slot.updated_at = new Date().toISOString();
      }
      return slot;
    },
    releaseExpiredHolds: async () => {
      const now = new Date();
      memoryStore.slots.forEach(slot => {
        if (slot.status === SLOT_STATUS.HELD && slot.held_until && new Date(slot.held_until) < now) {
          slot.status = SLOT_STATUS.AVAILABLE;
          slot.held_by_user_id = null;
          slot.held_until = null;
          slot.updated_at = now.toISOString();

          // Mark corresponding booking as EXPIRED
          if (slot.booking_id) {
            const b = memoryStore.bookings.find(bk => bk.id === slot.booking_id);
            if (b && (b.status === BOOKING_STATUS.REQUESTED || b.status === BOOKING_STATUS.PAYMENT_PENDING)) {
              b.status = BOOKING_STATUS.EXPIRED;
              b.updated_at = now.toISOString();
            }
          }
        }
      });
    }
  },

  // Bookings
  bookings: {
    findById: async (id) => memoryStore.bookings.find(b => b.id === id) || null,
    findByReference: async (ref) => memoryStore.bookings.find(b => b.booking_reference === ref) || null,
    findByTournamentId: async (tournamentId) => memoryStore.bookings.filter(b => b.tournament_id === tournamentId),
    findByUserId: async (userId) => memoryStore.bookings.filter(b => b.user_id === userId),
    create: async (data) => {
      const booking = {
        id: `bk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        booking_reference: data.booking_reference,
        tournament_id: data.tournament_id,
        slot_number: data.slot_number,
        user_id: data.user_id,
        team_id: data.team_id || null,
        team_name: data.team_name,
        entry_fee: Number(data.entry_fee),
        status: data.status || BOOKING_STATUS.REQUESTED,
        hold_expires_at: data.hold_expires_at,
        whatsapp_message: data.whatsapp_message || '',
        rejection_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      memoryStore.bookings.push(booking);
      return booking;
    },
    update: async (id, updates) => {
      const idx = memoryStore.bookings.findIndex(b => b.id === id);
      if (idx === -1) return null;
      memoryStore.bookings[idx] = {
        ...memoryStore.bookings[idx],
        ...updates,
        updated_at: new Date().toISOString()
      };
      return memoryStore.bookings[idx];
    }
  },

  // Payment Records
  paymentRecords: {
    findById: async (id) => memoryStore.paymentRecords.find(p => p.id === id) || null,
    findByBookingId: async (bookingId) => memoryStore.paymentRecords.find(p => p.booking_id === bookingId) || null,
    getAll: async () => [...memoryStore.paymentRecords],
    create: async (data) => {
      const record = {
        id: `pay-${Date.now()}`,
        booking_id: data.booking_id,
        amount: Number(data.amount),
        payment_method: data.payment_method || 'UPI / GPay',
        transaction_reference: data.transaction_reference,
        screenshot_url: data.screenshot_url || '',
        verification_status: data.verification_status || PAYMENT_STATUS.UNDER_VERIFICATION,
        verified_by: data.verified_by || null,
        verified_at: data.verified_at || null,
        rejection_reason: data.rejection_reason || null,
        created_at: new Date().toISOString()
      };
      memoryStore.paymentRecords.push(record);
      return record;
    },
    update: async (id, updates) => {
      const idx = memoryStore.paymentRecords.findIndex(p => p.id === id);
      if (idx === -1) return null;
      memoryStore.paymentRecords[idx] = {
        ...memoryStore.paymentRecords[idx],
        ...updates
      };
      return memoryStore.paymentRecords[idx];
    }
  },

  // Tournament Participants (Room membership)
  tournamentParticipants: {
    findByTournamentId: async (tournamentId) => {
      return memoryStore.tournamentParticipants.filter(tp => tp.tournament_id === tournamentId);
    },
    findByUserId: async (tournamentId, userId) => {
      return memoryStore.tournamentParticipants.find(tp => tp.tournament_id === tournamentId && tp.user_id === userId) || null;
    },
    add: async (data) => {
      const tp = {
        id: `tp-${Date.now()}`,
        tournament_id: data.tournament_id,
        slot_number: data.slot_number,
        user_id: data.user_id,
        team_id: data.team_id || null,
        team_name: data.team_name,
        booking_id: data.booking_id,
        joined_at: new Date().toISOString()
      };
      memoryStore.tournamentParticipants.push(tp);

      // Check if tournament has reached full capacity to unlock the room
      const tournament = memoryStore.tournaments.find(t => t.id === data.tournament_id);
      if (tournament) {
        const confirmedCount = memoryStore.tournamentParticipants.filter(p => p.tournament_id === tournament.id).length;
        if (confirmedCount >= tournament.max_participants) {
          tournament.is_room_unlocked = true;
          tournament.status = TOURNAMENT_STATUS.FULL;
          console.log(`[Tournament] ${tournament.id} reached FULL capacity (${confirmedCount}/${tournament.max_participants}). Room unlocked!`);
        }
      }

      return tp;
    }
  },

  // Real-Time Chat Messages
  chatMessages: {
    findByTournamentId: async (tournamentId, limit = 50) => {
      return memoryStore.chatMessages
        .filter(c => c.tournament_id === tournamentId)
        .slice(-limit);
    },
    create: async (data) => {
      const msg = {
        id: `msg-${Date.now()}`,
        tournament_id: data.tournament_id,
        user_id: data.user_id,
        username: data.username,
        user_role: data.user_role,
        avatar_url: data.avatar_url || '',
        message: data.message,
        message_type: data.message_type || 'CHAT',
        created_at: new Date().toISOString()
      };
      memoryStore.chatMessages.push(msg);
      return msg;
    }
  },

  // Map Scores
  mapScores: {
    findByTournamentAndMap: async (tournamentId, mapName) => {
      return memoryStore.mapScores.filter(s => s.tournament_id === tournamentId && s.map_name.toLowerCase() === mapName.toLowerCase());
    },
    getAllByTournament: async (tournamentId) => {
      return memoryStore.mapScores.filter(s => s.tournament_id === tournamentId);
    },
    upsertScore: async (data) => {
      const idx = memoryStore.mapScores.findIndex(
        s => s.tournament_id === data.tournament_id && 
             s.map_name.toLowerCase() === data.map_name.toLowerCase() && 
             s.slot_number === Number(data.slot_number)
      );

      const killPoints = Number(data.kills) * 1;
      let placementPoints = 0;
      if (Number(data.placement) === 1) placementPoints = 10;
      else if (Number(data.placement) === 2) placementPoints = 6;
      else if (Number(data.placement) === 3) placementPoints = 2;

      const totalPoints = killPoints + placementPoints;

      if (idx !== -1) {
        const prev = { ...memoryStore.mapScores[idx] };
        memoryStore.mapScores[idx] = {
          ...memoryStore.mapScores[idx],
          kills: Number(data.kills),
          kill_points: killPoints,
          placement: Number(data.placement),
          placement_points: placementPoints,
          total_points: totalPoints,
          entered_by_score_master_id: data.entered_by_score_master_id,
          updated_at: new Date().toISOString()
        };
        return { score: memoryStore.mapScores[idx], prev };
      } else {
        const newScore = {
          id: `score-${Date.now()}-${data.slot_number}`,
          tournament_id: data.tournament_id,
          map_name: data.map_name,
          slot_number: Number(data.slot_number),
          squad_name: data.squad_name,
          team_id: data.team_id || null,
          kills: Number(data.kills),
          kill_points: killPoints,
          placement: Number(data.placement),
          placement_points: placementPoints,
          total_points: totalPoints,
          entered_by_score_master_id: data.entered_by_score_master_id,
          updated_at: new Date().toISOString()
        };
        memoryStore.mapScores.push(newScore);
        return { score: newScore, prev: null };
      }
    }
  },

  // Score Modification Audit History
  scoreHistory: {
    findByTournamentId: async (tournamentId) => {
      return memoryStore.scoreHistory.filter(sh => sh.tournament_id === tournamentId);
    },
    create: async (data) => {
      const historyEntry = {
        id: `sh-${Date.now()}`,
        tournament_id: data.tournament_id,
        map_name: data.map_name,
        slot_number: data.slot_number,
        squad_name: data.squad_name,
        previous_value: data.previous_value,
        new_value: data.new_value,
        change_summary: data.change_summary,
        reason: data.reason,
        score_master_id: data.score_master_id,
        score_master_name: data.score_master_name,
        created_at: new Date().toISOString()
      };
      memoryStore.scoreHistory.unshift(historyEntry);
      return historyEntry;
    }
  },

  // Notifications
  notifications: {
    findByUserId: async (userId) => {
      return memoryStore.notifications.filter(n => n.user_id === userId);
    },
    create: async (data) => {
      const notif = {
        id: `notif-${Date.now()}`,
        user_id: data.user_id,
        title: data.title,
        message: data.message,
        type: data.type,
        reference_id: data.reference_id || null,
        is_read: false,
        created_at: new Date().toISOString()
      };
      memoryStore.notifications.unshift(notif);
      return notif;
    },
    markAsRead: async (id, userId) => {
      const n = memoryStore.notifications.find(notif => notif.id === id && notif.user_id === userId);
      if (n) n.is_read = true;
      return n;
    },
    markAllAsRead: async (userId) => {
      memoryStore.notifications.forEach(n => {
        if (n.user_id === userId) n.is_read = true;
      });
      return true;
    }
  },

  // Audit Logs
  auditLogs: {
    getAll: async () => [...memoryStore.auditLogs],
    create: async (data) => {
      const log = {
        id: `audit-${Date.now()}`,
        actor_id: data.actor_id || null,
        actor_role: data.actor_role,
        action: data.action,
        target_type: data.target_type,
        target_id: data.target_id,
        metadata: data.metadata || {},
        ip_address: data.ip_address || '127.0.0.1',
        created_at: new Date().toISOString()
      };
      memoryStore.auditLogs.unshift(log);
      return log;
    }
  },

  // Statistics & Financial Ledger (Calculated from Actual DB records)
  stats: {
    getPlatformStats: async () => {
      const totalUsers = memoryStore.profiles.length;
      const activePlayers = memoryStore.profiles.filter(p => p.role === ROLES.PLAYER || p.role === ROLES.TEAM_LEADER).length;
      const totalTeams = memoryStore.teams.length;
      const totalTournaments = memoryStore.tournaments.length;
      const activeMatches = memoryStore.matches.filter(m => m.status === 'LIVE').length;
      const totalBookings = memoryStore.bookings.length;
      const confirmedBookings = memoryStore.bookings.filter(b => b.status === BOOKING_STATUS.CONFIRMED).length;
      const pendingVerifications = memoryStore.bookings.filter(b => b.status === BOOKING_STATUS.UNDER_VERIFICATION).length;
      
      // Expected Gross Entry Collection = Sum of entry fee for all active tournaments at full capacity
      const expectedGrossEntry = memoryStore.tournaments.reduce((sum, t) => {
        const game = GAME_CONFIGS[t.game_id];
        return sum + (game ? game.expectedGrossEntry : (t.entry_fee * t.max_participants));
      }, 0);

      // Verified Payment Records = Actual verified funds in database
      const verifiedPaymentsTotal = memoryStore.paymentRecords
        .filter(p => p.verification_status === PAYMENT_STATUS.VERIFIED)
        .reduce((sum, p) => sum + Number(p.amount), 0);

      return {
        totalUsers,
        activePlayers,
        totalTeams,
        totalTournaments,
        activeMatches,
        totalBookings,
        confirmedBookings,
        pendingVerifications,
        expectedGrossEntry,
        verifiedPaymentsTotal
      };
    }
  }
};
