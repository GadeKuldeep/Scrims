import { db } from '../config/database.js';
import { ROLES, TOURNAMENT_STATUS } from '../config/constants.js';
import { validateISTSchedule } from '../utils/istTime.js';

export const tournamentController = {
  getTournaments: async (req, res, next) => {
    try {
      const { game_id, status } = req.query;
      const tournaments = await db.tournaments.getAll({ game_id, status });

      // Augment each tournament with capacity metrics and Match Master details
      const augmented = await Promise.all(tournaments.map(async (t) => {
        const slots = await db.slots.findByTournamentId(t.id);
        const bookedCount = slots.filter(s => s.status === 'BOOKED').length;
        const heldCount = slots.filter(s => s.status === 'HELD').length;
        const availableCount = slots.filter(s => s.status === 'AVAILABLE').length;

        const mm = t.assigned_match_master_id ? await db.profiles.findById(t.assigned_match_master_id) : null;
        const sm = t.assigned_score_master_id ? await db.profiles.findById(t.assigned_score_master_id) : null;

        return {
          ...t,
          stats: {
            totalSlots: t.max_participants,
            bookedSlots: bookedCount,
            heldSlots: heldCount,
            availableSlots: availableCount,
            fillPercentage: Math.round((bookedCount / t.max_participants) * 100),
            prizePool: 12000,
            prizes: [
              { position: 1, label: '1st Place', amount: 5000 },
              { position: 2, label: '2nd Place', amount: 3000 },
              { position: 3, label: '3rd Place', amount: 2000 },
              { position: 4, label: '4th Place', amount: 1000 },
              { position: 5, label: '5th Place', amount: 1000 }
            ]
          },
          matchMaster: mm ? { id: mm.id, username: mm.username, full_name: mm.full_name, staff_code: mm.staff_code, mobile_number: mm.mobile_number } : null,
          scoreMaster: sm ? { id: sm.id, username: sm.username, full_name: sm.full_name, staff_code: sm.staff_code } : null
        };
      }));

      res.json({ success: true, tournaments: augmented });
    } catch (err) {
      next(err);
    }
  },

  getTournamentById: async (req, res, next) => {
    try {
      const tournament = await db.tournaments.findById(req.params.id);
      if (!tournament) {
        return res.status(404).json({ success: false, error: 'Tournament not found' });
      }

      const slots = await db.slots.findByTournamentId(tournament.id);
      const matches = await db.matches.findByTournamentId(tournament.id);
      const participants = await db.tournamentParticipants.findByTournamentId(tournament.id);

      const mm = tournament.assigned_match_master_id ? await db.profiles.findById(tournament.assigned_match_master_id) : null;
      const sm = tournament.assigned_score_master_id ? await db.profiles.findById(tournament.assigned_score_master_id) : null;

      const bookedCount = slots.filter(s => s.status === 'BOOKED').length;
      const heldCount = slots.filter(s => s.status === 'HELD').length;
      const availableCount = slots.filter(s => s.status === 'AVAILABLE').length;

      res.json({
        success: true,
        tournament: {
          ...tournament,
          // Hide room credentials from general details
          room_id: undefined,
          room_password: undefined,
          isRoomUnlocked: tournament.is_room_unlocked,
          stats: {
            totalSlots: tournament.max_participants,
            bookedSlots: bookedCount,
            heldSlots: heldCount,
            availableSlots: availableCount,
            fillPercentage: Math.round((bookedCount / tournament.max_participants) * 100),
            prizePool: 12000,
            prizes: [
              { position: 1, label: '1st Place', amount: 5000 },
              { position: 2, label: '2nd Place', amount: 3000 },
              { position: 3, label: '3rd Place', amount: 2000 },
              { position: 4, label: '4th Place', amount: 1000 },
              { position: 5, label: '5th Place', amount: 1000 }
            ]
          },
          matchMaster: mm ? { id: mm.id, username: mm.username, full_name: mm.full_name, staff_code: mm.staff_code, mobile_number: mm.mobile_number } : null,
          scoreMaster: sm ? { id: sm.id, username: sm.username, full_name: sm.full_name, staff_code: sm.staff_code } : null,
          matches,
          slots,
          participants
        }
      });
    } catch (err) {
      next(err);
    }
  },

  createTournament: async (req, res, next) => {
    try {
      const {
        id,
        title,
        game_id,
        description,
        banner_url,
        entry_fee,
        max_participants,
        tournament_date,
        start_time_ist,
        end_time_ist,
        rules,
        assigned_match_master_id,
        assigned_score_master_id
      } = req.body;

      if (!title || !game_id || !start_time_ist || !end_time_ist) {
        return res.status(400).json({ success: false, error: 'Title, Game ID, Start Time IST, and End Time IST are required.' });
      }

      // Validate IST schedule
      const startCheck = validateISTSchedule(start_time_ist);
      if (!startCheck.valid) {
        return res.status(400).json({ success: false, error: startCheck.error });
      }

      const endCheck = validateISTSchedule(end_time_ist);
      if (!endCheck.valid) {
        return res.status(400).json({ success: false, error: endCheck.error });
      }

      const game = await db.games.findById(game_id);
      if (!game) {
        return res.status(400).json({ success: false, error: 'Invalid game_id. Game not configured.' });
      }

      const newTournament = await db.tournaments.create({
        id,
        title,
        game_id,
        description,
        banner_url,
        entry_fee: entry_fee !== undefined ? Number(entry_fee) : game.entry_fee,
        max_participants: max_participants !== undefined ? Number(max_participants) : game.max_slots,
        tournament_date,
        start_time_ist,
        end_time_ist,
        rules: rules || `Standard ${game.title} rules apply.`,
        assigned_match_master_id,
        assigned_score_master_id
      });

      // Create default map schedule based on game configuration
      if (game.maps && game.maps.length > 0) {
        for (let i = 0; i < game.maps.length; i++) {
          await db.matches.create({
            tournament_id: newTournament.id,
            match_number: i + 1,
            map_name: game.maps[i],
            scheduled_start_ist: `${start_time_ist} (Match ${i + 1})`,
            status: 'SCHEDULED'
          });
        }
      }

      await db.auditLogs.create({
        actor_id: req.user.id,
        actor_role: req.user.role,
        action: 'TOURNAMENT_CREATED',
        target_type: 'TOURNAMENT',
        target_id: newTournament.id,
        metadata: { title, game_id, entry_fee: newTournament.entry_fee }
      });

      res.status(201).json({ success: true, message: 'Tournament created successfully.', tournament: newTournament });
    } catch (err) {
      next(err);
    }
  },

  updateTournament: async (req, res, next) => {
    try {
      const updates = req.body;
      const updated = await db.tournaments.update(req.params.id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Tournament not found.' });
      }

      await db.auditLogs.create({
        actor_id: req.user.id,
        actor_role: req.user.role,
        action: 'TOURNAMENT_UPDATED',
        target_type: 'TOURNAMENT',
        target_id: req.params.id,
        metadata: updates
      });

      res.json({ success: true, message: 'Tournament updated successfully.', tournament: updated });
    } catch (err) {
      next(err);
    }
  },

  getSlots: async (req, res, next) => {
    try {
      const slots = await db.slots.findByTournamentId(req.params.id);
      res.json({ success: true, slots });
    } catch (err) {
      next(err);
    }
  },

  getRoomCredentials: async (req, res, next) => {
    try {
      const tournament = await db.tournaments.findById(req.params.id);
      if (!tournament) {
        return res.status(404).json({ success: false, error: 'Tournament not found' });
      }

      // Check user authorization: Super Admin, assigned MM, assigned SM, or confirmed participant
      const isSuperAdmin = req.user.role === ROLES.SUPER_ADMIN;
      const isAssignedMM = tournament.assigned_match_master_id === req.user.id;
      const isAssignedSM = tournament.assigned_score_master_id === req.user.id;
      
      const participant = await db.tournamentParticipants.findByUserId(tournament.id, req.user.id);
      const isConfirmedParticipant = !!participant;

      if (!isSuperAdmin && !isAssignedMM && !isAssignedSM && !isConfirmedParticipant) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Only confirmed participants and assigned staff may access the tournament room.'
        });
      }

      // Check room lock state (unlocked only when full capacity reached)
      if (!tournament.is_room_unlocked && !isSuperAdmin && !isAssignedMM) {
        return res.status(403).json({
          success: false,
          isRoomUnlocked: false,
          error: `Tournament room is locked. Unlocks automatically once all ${tournament.max_participants}/${tournament.max_participants} squads are confirmed by Match Master.`
        });
      }

      res.json({
        success: true,
        isRoomUnlocked: tournament.is_room_unlocked,
        room_id: tournament.room_id || '8849 2011',
        room_password: tournament.room_password || 'SCRIMS-TITAN-99',
        instructions: 'Enter BGMI Custom Room using Room ID & Password at least 10 minutes prior to drop time.'
      });
    } catch (err) {
      next(err);
    }
  }
};
