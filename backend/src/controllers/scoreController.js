import { db } from '../config/database.js';
import { ROLES } from '../config/constants.js';
import { getIO } from '../socketInstance.js';

export const scoreController = {
  // Get map-wise scores for a specific tournament and map
  getMapScores: async (req, res, next) => {
    try {
      const { tournamentId, mapName } = req.params;
      const scores = await db.mapScores.findByTournamentAndMap(tournamentId, mapName);
      
      // Sort by total points desc, placement asc
      scores.sort((a, b) => b.total_points - a.total_points || (a.placement && b.placement ? a.placement - b.placement : 0));

      res.json({ success: true, scores });
    } catch (err) {
      next(err);
    }
  },

  // Get cumulative/aggregate tournament leaderboard across all 4 maps
  getAggregateLeaderboard: async (req, res, next) => {
    try {
      const { tournamentId } = req.params;
      const allScores = await db.mapScores.getAllByTournament(tournamentId);
      const tournament = await db.tournaments.findById(tournamentId);

      // Aggregate by slot_number / squad_name
      const squadMap = {};

      allScores.forEach(score => {
        const key = score.slot_number;
        if (!squadMap[key]) {
          squadMap[key] = {
            slot_number: score.slot_number,
            squad_name: score.squad_name,
            team_id: score.team_id,
            totalKills: 0,
            killPoints: 0,
            placementPoints: 0,
            totalPoints: 0,
            chickenDinners: 0,
            matchesPlayed: 0,
            mapBreakdown: {
              Erangel: null,
              Livik: null,
              Rondo: null,
              Miramar: null
            }
          };
        }

        squadMap[key].matchesPlayed += 1;
        squadMap[key].totalKills += score.kills;
        squadMap[key].killPoints += score.kill_points;
        squadMap[key].placementPoints += score.placement_points;
        squadMap[key].totalPoints += score.total_points;
        if (score.placement === 1) {
          squadMap[key].chickenDinners += 1;
        }

        squadMap[key].mapBreakdown[score.map_name] = {
          kills: score.kills,
          placement: score.placement,
          points: score.total_points
        };
      });

      // Convert to array and sort according to BGMI competitive tie-breakers
      // 1. Total Points desc
      // 2. Chicken Dinners (1st places) desc
      // 3. Kill Points desc
      const leaderboard = Object.values(squadMap).sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.chickenDinners !== a.chickenDinners) return b.chickenDinners - a.chickenDinners;
        return b.killPoints - a.killPoints;
      });

      // Assign overall rank
      leaderboard.forEach((team, index) => {
        team.overallRank = index + 1;
      });

      res.json({
        success: true,
        tournamentId,
        leaderboard,
        scoringRules: tournament?.scoring_config || {
          killPoint: 1,
          placement: { 1: 10, 2: 6, 3: 2, others: 0 }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Score Master enters/updates score for a specific squad in a map
  updateMapScore: async (req, res, next) => {
    try {
      const { tournamentId } = req.params;
      const { map_name, slot_number, squad_name, kills, placement, reason } = req.body;

      if (!map_name || slot_number === undefined || kills === undefined || placement === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Map name, slot number, kills, and placement are required.'
        });
      }

      const tournament = await db.tournaments.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({ success: false, error: 'Tournament not found' });
      }

      // Authorization check: Only assigned Score Master or Super Admin
      if (req.user.role !== ROLES.SUPER_ADMIN && tournament.assigned_score_master_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You are not the assigned Score Master for this tournament.'
        });
      }

      // Upsert Score
      const { score, prev } = await db.mapScores.upsertScore({
        tournament_id: tournamentId,
        map_name,
        slot_number: Number(slot_number),
        squad_name: squad_name || `Slot #${slot_number}`,
        kills: Number(kills),
        placement: Number(placement),
        entered_by_score_master_id: req.user.id
      });

      // Record Audit History
      const previousValue = prev ? { kills: prev.kills, placement: prev.placement, total_points: prev.total_points } : { kills: 0, placement: 0, total_points: 0 };
      const newValue = { kills: score.kills, placement: score.placement, total_points: score.total_points };
      const deltaSummary = prev 
        ? `Updated from Kills: ${prev.kills}, Rank: ${prev.placement} (${prev.total_points} pts) -> Kills: ${score.kills}, Rank: ${score.placement} (${score.total_points} pts)`
        : `Initial Entry: ${score.kills} Kills, Rank #${score.placement} (${score.total_points} pts)`;

      const historyEntry = await db.scoreHistory.create({
        tournament_id: tournamentId,
        map_name,
        slot_number: Number(slot_number),
        squad_name: score.squad_name,
        previous_value: previousValue,
        new_value: newValue,
        change_summary: deltaSummary,
        reason: reason || 'Live Match Official Score Entry',
        score_master_id: req.user.id,
        score_master_name: req.user.username
      });

      // Broadcast score update via Socket.IO to players & scoreboards
      const io = getIO();
      if (io) {
        io.to(`tournament:${tournamentId}`).emit('score:updated', {
          tournamentId,
          map_name,
          slot_number: score.slot_number,
          score,
          historyEntry
        });

        io.emit('scoreboard:refresh', { tournamentId });
      }

      res.json({
        success: true,
        message: 'Score saved and broadcasted successfully.',
        score,
        historyEntry
      });
    } catch (err) {
      next(err);
    }
  },

  // Get score modification audit history
  getScoreHistory: async (req, res, next) => {
    try {
      const { tournamentId } = req.params;
      const history = await db.scoreHistory.findByTournamentId(tournamentId);
      res.json({ success: true, history });
    } catch (err) {
      next(err);
    }
  }
};
