/**
 * IST (Indian Standard Time, UTC+05:30) utility functions
 */

export function getCurrentISTString() {
  const options = {
    timeZone: 'Asia/Kolkata',
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  return new Intl.DateTimeFormat('en-IN', options).format(new Date()) + ' IST';
}

export function getCurrentISTDateString() {
  const options = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  };
  return new Intl.DateTimeFormat('en-IN', options).format(new Date());
}

/**
 * Validates match schedule to ensure it adheres to 11:00 AM - 11:00 PM IST
 * Hourly sessions: 11:00 AM, 12:00 PM, 01:00 PM ... 11:00 PM IST
 */
export function validateISTSchedule(timeString) {
  if (!timeString) return { valid: false, error: 'Schedule time is required' };
  
  // Format check: e.g. "09:00 PM IST" or "11:00 AM IST"
  const clean = timeString.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)\s*IST$/);
  
  if (!match) {
    return { valid: false, error: 'Time must be in format "HH:MM AM/PM IST" (e.g. 09:00 PM IST)' };
  }

  let [_, hoursStr, minutesStr, period] = match;
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  // Window: 11:00 (11 AM) to 23:00 (11 PM)
  if (hours < 11 || hours > 23) {
    return { valid: false, error: 'Matches must be scheduled between 11:00 AM and 11:00 PM IST' };
  }

  // Must finish before 11:59 PM IST
  if (hours === 23 && minutes > 0) {
    return { valid: false, error: 'Final match session must begin at or before 11:00 PM IST to finish by 11:59 PM IST' };
  }

  return { valid: true };
}
