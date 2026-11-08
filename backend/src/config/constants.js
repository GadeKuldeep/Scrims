/**
 * SCRIMS Esports Tournament Management Platform
 * System-Wide Constants & Configurations
 */

export const ROLES = {
  PLAYER: 'PLAYER',
  TEAM_LEADER: 'TEAM_LEADER',
  MATCH_MASTER: 'MATCH_MASTER',
  SCORE_MASTER: 'SCORE_MASTER',
  SUPER_ADMIN: 'SUPER_ADMIN'
};

export const TOURNAMENT_STATUS = {
  DRAFT: 'DRAFT',
  UPCOMING: 'UPCOMING',
  REGISTRATION_OPEN: 'REGISTRATION_OPEN',
  FULL: 'FULL',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export const SLOT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  HELD: 'HELD',
  BOOKED: 'BOOKED'
};

export const BOOKING_STATUS = {
  REQUESTED: 'REQUESTED',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  UNDER_VERIFICATION: 'UNDER_VERIFICATION',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
};

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  UNDER_VERIFICATION: 'UNDER_VERIFICATION',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
};

export const GAME_CONFIGS = {
  bgmi: {
    id: 'bgmi',
    title: 'Battlegrounds Mobile India',
    maxSlots: 16,
    entryFee: 1200,
    expectedGrossEntry: 19200,
    maps: ['Erangel', 'Livik', 'Rondo', 'Miramar'],
    scoring: {
      killPoint: 1,
      placement: {
        1: 10,
        2: 6,
        3: 2,
        others: 0
      }
    }
  },
  freefire: {
    id: 'freefire',
    title: 'Free Fire MAX',
    maxSlots: 12,
    entryFee: 800,
    expectedGrossEntry: 9600,
    maps: ['Bermuda', 'Purgatory', 'Kalahari'],
    scoring: {
      killPoint: 1,
      placement: {
        1: 12,
        2: 9,
        3: 8,
        4: 7,
        5: 6,
        others: 0
      }
    }
  },
  clashofclans: {
    id: 'clashofclans',
    title: 'Clash of Clans War',
    maxSlots: 2,
    entryFee: 1200,
    expectedGrossEntry: 2400,
    maps: ['War Base Alpha', 'War Base Beta'],
    scoring: {
      starPoints: 10,
      destructionPercentagePoints: 1
    }
  }
};

export const SLOT_HOLD_DURATION_MINUTES = 10;
export const SLOT_HOLD_DURATION_MS = SLOT_HOLD_DURATION_MINUTES * 60 * 1000;
