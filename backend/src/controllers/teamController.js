import { db } from '../config/database.js';
import { ROLES } from '../config/constants.js';

export const teamController = {
  createTeam: async (req, res, next) => {
    try {
      const { name, tag, logo_url, bio, in_game_id } = req.body;

      if (!name || !tag) {
        return res.status(400).json({ success: false, error: 'Team name and tag are required.' });
      }

      const existing = await db.teams.findByName(name);
      if (existing) {
        return res.status(400).json({ success: false, error: 'A team with this name already exists.' });
      }

      const existingLeaderTeam = await db.teams.findByLeaderId(req.user.id);
      if (existingLeaderTeam) {
        return res.status(400).json({ success: false, error: 'You are already the leader of a team.' });
      }

      const team = await db.teams.create({
        name,
        tag,
        logo_url,
        leader_id: req.user.id,
        bio,
        in_game_id: in_game_id || req.user.in_game_id
      });

      // Update user role to TEAM_LEADER if they were PLAYER
      if (req.user.role === ROLES.PLAYER) {
        await db.profiles.update(req.user.id, { role: ROLES.TEAM_LEADER });
      }

      res.status(201).json({
        success: true,
        message: 'Team created successfully.',
        team
      });
    } catch (err) {
      next(err);
    }
  },

  getMyTeam: async (req, res, next) => {
    try {
      let team = await db.teams.findByLeaderId(req.user.id);
      let membership = null;

      if (!team) {
        membership = await db.teamMembers.findByUserId(req.user.id);
        if (membership) {
          team = await db.teams.findById(membership.team_id);
        }
      }

      if (!team) {
        return res.json({ success: true, team: null });
      }

      const members = await db.teamMembers.findByTeamId(team.id);
      const invitations = await db.teamInvitations.findByTeamId(team.id);

      res.json({
        success: true,
        team: {
          ...team,
          members,
          invitations
        }
      });
    } catch (err) {
      next(err);
    }
  },

  getTeamById: async (req, res, next) => {
    try {
      const team = await db.teams.findById(req.params.id);
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found.' });
      }

      const members = await db.teamMembers.findByTeamId(team.id);
      res.json({ success: true, team: { ...team, members } });
    } catch (err) {
      next(err);
    }
  },

  inviteMember: async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const { username_or_email } = req.body;

      const team = await db.teams.findById(teamId);
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found.' });
      }

      if (team.leader_id !== req.user.id && req.user.role !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({ success: false, error: 'Only team leader can invite members.' });
      }

      let targetUser = await db.profiles.findByEmail(username_or_email);
      if (!targetUser) {
        targetUser = await db.profiles.findByUsername(username_or_email);
      }

      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'Player with given username or email not found.' });
      }

      const invitation = await db.teamInvitations.create({
        team_id: team.id,
        invited_user_id: targetUser.id,
        invited_by_id: req.user.id
      });

      await db.notifications.create({
        user_id: targetUser.id,
        title: 'Team Invitation Received',
        message: `${req.user.username} invited you to join team "${team.name}" [${team.tag}].`,
        type: 'TEAM_INVITE',
        reference_id: invitation.id
      });

      res.status(201).json({ success: true, message: 'Invitation dispatched.', invitation });
    } catch (err) {
      next(err);
    }
  },

  respondToInvitation: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { action } = req.body; // 'ACCEPT' or 'DECLINE'

      const invitations = await db.teamInvitations.findByUserId(req.user.id);
      const invitation = invitations.find(i => i.id === id);

      if (!invitation) {
        return res.status(404).json({ success: false, error: 'Invitation not found.' });
      }

      if (action === 'ACCEPT') {
        await db.teamInvitations.update(id, { status: 'ACCEPTED' });
        await db.teamMembers.addMember({
          team_id: invitation.team_id,
          user_id: req.user.id,
          role: 'ASSAULTER',
          in_game_id: req.user.in_game_id || ''
        });

        const team = await db.teams.findById(invitation.team_id);
        await db.notifications.create({
          user_id: team.leader_id,
          title: 'Invitation Accepted',
          message: `${req.user.username} accepted your invitation and joined ${team.name}.`,
          type: 'TEAM_MEMBER_JOINED'
        });

        return res.json({ success: true, message: `Joined ${team.name} successfully.` });
      } else {
        await db.teamInvitations.update(id, { status: 'DECLINED' });
        return res.json({ success: true, message: 'Invitation declined.' });
      }
    } catch (err) {
      next(err);
    }
  },

  removeMember: async (req, res, next) => {
    try {
      const { teamId, userId } = req.params;
      const team = await db.teams.findById(teamId);
      if (!team) return res.status(404).json({ success: false, error: 'Team not found.' });

      if (team.leader_id !== req.user.id && req.user.role !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({ success: false, error: 'Only team leader can remove members.' });
      }

      if (userId === team.leader_id) {
        return res.status(400).json({ success: false, error: 'Team leader cannot be removed.' });
      }

      await db.teamMembers.removeMember(teamId, userId);
      res.json({ success: true, message: 'Member removed from team.' });
    } catch (err) {
      next(err);
    }
  }
};
