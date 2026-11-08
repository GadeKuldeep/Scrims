import { db } from '../config/database.js';

export const gameController = {
  getGames: async (req, res, next) => {
    try {
      const games = await db.games.getAll();
      res.json({ success: true, games });
    } catch (err) {
      next(err);
    }
  },

  getGameById: async (req, res, next) => {
    try {
      const game = await db.games.findById(req.params.id);
      if (!game) {
        return res.status(404).json({ success: false, error: 'Game not found' });
      }
      res.json({ success: true, game });
    } catch (err) {
      next(err);
    }
  },

  updateGame: async (req, res, next) => {
    try {
      const { entry_fee, max_slots, scoring_rules, maps } = req.body;
      const updates = {};
      if (entry_fee !== undefined) {
        updates.entry_fee = Number(entry_fee);
        updates.expected_gross_entry = updates.entry_fee * (max_slots || 16);
      }
      if (max_slots !== undefined) updates.max_slots = Number(max_slots);
      if (scoring_rules) updates.scoring_rules = scoring_rules;
      if (maps) updates.maps = maps;

      const updated = await db.games.update(req.params.id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Game not found' });
      }

      await db.auditLogs.create({
        actor_id: req.user.id,
        actor_role: req.user.role,
        action: 'GAME_CONFIG_UPDATED',
        target_type: 'GAME',
        target_id: req.params.id,
        metadata: updates
      });

      res.json({ success: true, message: 'Game configuration updated.', game: updated });
    } catch (err) {
      next(err);
    }
  }
};
