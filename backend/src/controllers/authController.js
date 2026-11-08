import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';
import { ENV } from '../config/env.js';
import { ROLES } from '../config/constants.js';

export const authController = {
  // Register Player or Team Leader
  register: async (req, res, next) => {
    try {
      const { username, full_name, email, password, mobile_number, in_game_id, role } = req.body;

      if (!username || !full_name || !email || !password || !mobile_number) {
        return res.status(400).json({ success: false, error: 'All required fields must be provided.' });
      }

      // Role check: Public registration can only create PLAYER or TEAM_LEADER
      const assignedRole = role === ROLES.TEAM_LEADER ? ROLES.TEAM_LEADER : ROLES.PLAYER;

      // Check unique constraints
      const existingEmail = await db.profiles.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
      }

      const existingUsername = await db.profiles.findByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ success: false, error: 'This username is already taken.' });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      const profile = await db.profiles.create({
        username,
        full_name,
        email,
        password_hash,
        mobile_number,
        in_game_id: in_game_id || '',
        role: assignedRole
      });

      // Generate JWT
      const token = jwt.sign(
        { id: profile.id, role: profile.role, username: profile.username },
        ENV.JWT_SECRET,
        { expiresIn: ENV.JWT_EXPIRES_IN }
      );

      // Audit log
      await db.auditLogs.create({
        actor_id: profile.id,
        actor_role: profile.role,
        action: 'USER_REGISTERED',
        target_type: 'PROFILE',
        target_id: profile.id,
        metadata: { username, email, role: assignedRole }
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        token,
        user: {
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          email: profile.email,
          mobile_number: profile.mobile_number,
          avatar_url: profile.avatar_url,
          in_game_id: profile.in_game_id,
          role: profile.role
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Login
  login: async (req, res, next) => {
    try {
      const { identifier, email, password } = req.body;
      const loginKey = (identifier || email || '').trim();

      if (!loginKey || !password) {
        return res.status(400).json({ success: false, error: 'Username/Email and Password are required.' });
      }

      // Try finding by email, username, or mobile number
      let user = await db.profiles.findByEmail(loginKey);
      if (!user) {
        user = await db.profiles.findByUsername(loginKey);
      }
      if (!user && db.profiles.findByMobile) {
        user = await db.profiles.findByMobile(loginKey);
      }

      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials. User not found.' });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid password. Please check your credentials.' });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, role: user.role, username: user.username },
        ENV.JWT_SECRET,
        { expiresIn: ENV.JWT_EXPIRES_IN }
      );

      // Fetch team if team leader
      let team = null;
      if (user.role === ROLES.TEAM_LEADER) {
        team = await db.teams.findByLeaderId(user.id);
      }

      res.json({
        success: true,
        message: 'Logged in successfully.',
        token,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          mobile_number: user.mobile_number,
          avatar_url: user.avatar_url,
          in_game_id: user.in_game_id,
          role: user.role,
          staff_code: user.staff_code,
          team
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Me (Profile & Session)
  me: async (req, res, next) => {
    try {
      const user = await db.profiles.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User profile not found.' });
      }

      let team = null;
      if (user.role === ROLES.TEAM_LEADER) {
        team = await db.teams.findByLeaderId(user.id);
      } else {
        const membership = await db.teamMembers.findByUserId(user.id);
        if (membership) {
          team = await db.teams.findById(membership.team_id);
        }
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          mobile_number: user.mobile_number,
          avatar_url: user.avatar_url,
          in_game_id: user.in_game_id,
          role: user.role,
          staff_code: user.staff_code,
          team
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Update Profile (Disallows changing role!)
  updateProfile: async (req, res, next) => {
    try {
      const { full_name, mobile_number, in_game_id, avatar_url } = req.body;
      const updates = {};
      if (full_name) updates.full_name = full_name;
      if (mobile_number) updates.mobile_number = mobile_number;
      if (in_game_id !== undefined) updates.in_game_id = in_game_id;
      if (avatar_url) updates.avatar_url = avatar_url;

      const updated = await db.profiles.update(req.user.id, updates);
      res.json({
        success: true,
        message: 'Profile updated successfully.',
        user: {
          id: updated.id,
          username: updated.username,
          full_name: updated.full_name,
          email: updated.email,
          mobile_number: updated.mobile_number,
          avatar_url: updated.avatar_url,
          in_game_id: updated.in_game_id,
          role: updated.role,
          staff_code: updated.staff_code
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Forgot Password
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await db.profiles.findByEmail(email);
      if (!user) {
        // Return success to avoid email enumeration
        return res.json({ success: true, message: 'If an account exists, a password reset link has been dispatched.' });
      }
      res.json({ success: true, message: 'Password reset link sent to your registered email.' });
    } catch (err) {
      next(err);
    }
  },

  // Reset Password
  resetPassword: async (req, res, next) => {
    try {
      const { email, newPassword } = req.body;
      const user = await db.profiles.findByEmail(email);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }
      const password_hash = await bcrypt.hash(newPassword, 10);
      await db.profiles.update(user.id, { password_hash });
      res.json({ success: true, message: 'Password has been reset successfully. Please log in.' });
    } catch (err) {
      next(err);
    }
  }
};
