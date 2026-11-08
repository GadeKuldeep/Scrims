import { db } from '../config/database.js';
import { BOOKING_STATUS, SLOT_STATUS, TOURNAMENT_STATUS } from '../config/constants.js';
import { generateBookingReference, generateWhatsAppMessage } from '../utils/bookingRef.js';
import { getIO } from '../socketInstance.js';

export const bookingController = {
  // Request / Reserve a slot with a 10-minute hold
  createBookingHold: async (req, res, next) => {
    try {
      const { tournament_id, slot_number, team_name } = req.body;

      if (!tournament_id || !slot_number) {
        return res.status(400).json({ success: false, error: 'Tournament ID and Slot Number are required.' });
      }

      const tournament = await db.tournaments.findById(tournament_id);
      if (!tournament) {
        return res.status(404).json({ success: false, error: 'Tournament not found.' });
      }

      if (tournament.status !== TOURNAMENT_STATUS.REGISTRATION_OPEN) {
        return res.status(400).json({
          success: false,
          error: `Registrations are not open for this tournament (Status: ${tournament.status}).`
        });
      }

      // Check if user already has an active or confirmed booking for this tournament
      const existingBookings = await db.bookings.findByTournamentId(tournament_id);
      const duplicate = existingBookings.find(
        b => b.user_id === req.user.id && 
        [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.PAYMENT_PENDING, BOOKING_STATUS.UNDER_VERIFICATION, BOOKING_STATUS.CONFIRMED].includes(b.status)
      );

      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: `You already have an active booking (${duplicate.booking_reference}) in this tournament.`
        });
      }

      // Concurrency-safe atomic slot reservation (10-minute hold)
      let reservation;
      try {
        reservation = await db.slots.reserveSlot(tournament_id, Number(slot_number), req.user.id, 10);
      } catch (err) {
        return res.status(409).json({ success: false, error: err.message });
      }

      // Resolve team
      let userTeam = null;
      if (req.user.role === 'TEAM_LEADER') {
        userTeam = await db.teams.findByLeaderId(req.user.id);
      }
      const resolvedTeamName = team_name || (userTeam ? userTeam.name : `${req.user.username}'s Squad`);

      // Generate unique booking reference
      const game = await db.games.findById(tournament.game_id);
      const bookingRef = generateBookingReference(game?.slug || 'BGMI');

      // Fetch assigned Match Master for WhatsApp click-to-chat
      const mm = tournament.assigned_match_master_id 
        ? await db.profiles.findById(tournament.assigned_match_master_id)
        : null;
      const mmPhone = mm?.mobile_number?.replace(/[^0-9]/g, '') || '919876543210';

      const prefilledWaText = generateWhatsAppMessage({
        playerName: req.user.full_name || req.user.username,
        playerId: req.user.in_game_id,
        mobileNumber: req.user.mobile_number,
        email: req.user.email,
        teamName: resolvedTeamName,
        gameTitle: game?.title || 'BGMI',
        tournamentTitle: tournament.title,
        matchSchedule: `${tournament.tournament_date} @ ${tournament.start_time_ist}`,
        slotNumber: slot_number,
        entryFee: tournament.entry_fee,
        bookingReference: bookingRef
      });

      const whatsappUrl = `https://wa.me/${mmPhone}?text=${encodeURIComponent(prefilledWaText)}`;

      // Create Booking Record
      const booking = await db.bookings.create({
        booking_reference: bookingRef,
        tournament_id,
        slot_number: Number(slot_number),
        user_id: req.user.id,
        team_id: userTeam ? userTeam.id : null,
        team_name: resolvedTeamName,
        entry_fee: tournament.entry_fee,
        status: BOOKING_STATUS.PAYMENT_PENDING,
        hold_expires_at: reservation.holdExpiresAt,
        whatsapp_message: prefilledWaText
      });

      // Update slot reference
      reservation.slot.booking_id = booking.id;

      // Broadcast slot hold update to all connected clients
      const io = getIO();
      if (io) {
        io.emit('slot:updated', {
          tournament_id,
          slot_number: Number(slot_number),
          status: SLOT_STATUS.HELD,
          held_until: reservation.holdExpiresAt
        });
      }

      // Create in-app notification
      await db.notifications.create({
        user_id: req.user.id,
        title: 'Slot Held — 10 Minute Window',
        message: `Slot #${slot_number} reserved. Submit payment details or contact Match Master via WhatsApp to confirm before ${new Date(reservation.holdExpiresAt).toLocaleTimeString()}.`,
        type: 'BOOKING_CREATED',
        reference_id: booking.booking_reference
      });

      res.status(201).json({
        success: true,
        message: 'Slot reserved with temporary 10-minute hold.',
        booking,
        holdExpiresAt: reservation.holdExpiresAt,
        whatsappUrl,
        matchMaster: mm ? {
          name: mm.full_name,
          username: mm.username,
          phone: mm.mobile_number,
          staff_code: mm.staff_code
        } : null
      });
    } catch (err) {
      next(err);
    }
  },

  // Release a held slot
  releaseHold: async (req, res, next) => {
    try {
      const { id } = req.params;
      const booking = await db.bookings.findById(id);
      if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking not found.' });
      }

      if (booking.user_id !== req.user.id && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'MATCH_MASTER') {
        return res.status(403).json({ success: false, error: 'Unauthorized to cancel this booking.' });
      }

      if (booking.status === BOOKING_STATUS.CONFIRMED) {
        return res.status(400).json({ success: false, error: 'Confirmed bookings cannot be cancelled by players.' });
      }

      await db.slots.releaseSlot(booking.tournament_id, booking.slot_number);
      await db.bookings.update(booking.id, { status: BOOKING_STATUS.CANCELLED });

      const io = getIO();
      if (io) {
        io.emit('slot:updated', {
          tournament_id: booking.tournament_id,
          slot_number: booking.slot_number,
          status: SLOT_STATUS.AVAILABLE
        });
      }

      res.json({ success: true, message: 'Slot hold released successfully.' });
    } catch (err) {
      next(err);
    }
  },

  getMyBookings: async (req, res, next) => {
    try {
      const bookings = await db.bookings.findByUserId(req.user.id);
      
      const enriched = await Promise.all(bookings.map(async (b) => {
        const tournament = await db.tournaments.findById(b.tournament_id);
        const payment = await db.paymentRecords.findByBookingId(b.id);
        return {
          ...b,
          tournament: tournament ? {
            id: tournament.id,
            title: tournament.title,
            game_id: tournament.game_id,
            tournament_date: tournament.tournament_date,
            start_time_ist: tournament.start_time_ist,
            status: tournament.status,
            is_room_unlocked: tournament.is_room_unlocked
          } : null,
          payment
        };
      }));

      res.json({ success: true, bookings: enriched });
    } catch (err) {
      next(err);
    }
  },

  getTournamentBookings: async (req, res, next) => {
    try {
      const { tournamentId } = req.params;
      const bookings = await db.bookings.findByTournamentId(tournamentId);

      const enriched = await Promise.all(bookings.map(async (b) => {
        const player = await db.profiles.findById(b.user_id);
        const payment = await db.paymentRecords.findByBookingId(b.id);
        return {
          ...b,
          player: player ? {
            username: player.username,
            full_name: player.full_name,
            email: player.email,
            mobile_number: player.mobile_number,
            in_game_id: player.in_game_id
          } : null,
          payment
        };
      }));

      res.json({ success: true, bookings: enriched });
    } catch (err) {
      next(err);
    }
  }
};
