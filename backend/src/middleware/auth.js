import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { db } from '../config/database.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token missing or invalid.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Session expired or token invalid. Please log in again.'
      });
    }

    const user = await db.profiles.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account not found.'
      });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      staff_code: user.staff_code,
      in_game_id: user.in_game_id
    };

    next();
  } catch (error) {
    next(error);
  }
}
