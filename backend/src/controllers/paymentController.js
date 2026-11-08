import { db } from '../config/database.js';
import { BOOKING_STATUS, PAYMENT_STATUS, SLOT_STATUS } from '../config/constants.js';
import { getIO } from '../socketInstance.js';

export const paymentController = {
  // Player submits external payment verification request
  submitPaymentProof: async (req, res, next) => {
    try {
      const { booking_id, transaction_reference, payment_method, screenshot_url } = req.body;

      if (!booking_id || !transaction_reference) {
        return res.status(400).json({
          success: false,
          error: 'Booking ID and Transaction Reference (e.g., UPI UTR Number) are required.'
        });
      }

      const booking = await db.bookings.findById(booking_id);
      if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking not found.' });
      }

      if (booking.user_id !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Unauthorized to submit payment for this booking.' });
      }

      if (booking.status === BOOKING_STATUS.CONFIRMED) {
        return res.status(400).json({ success: false, error: 'This booking is already confirmed.' });
      }

      // Check if a payment record already exists
      let record = await db.paymentRecords.findByBookingId(booking_id);
      if (record) {
        record = await db.paymentRecords.update(record.id, {
          transaction_reference,
          payment_method: payment_method || 'UPI / GPay',
          screenshot_url: screenshot_url || '',
          verification_status: PAYMENT_STATUS.UNDER_VERIFICATION,
          rejection_reason: null
        });
      } else {
        record = await db.paymentRecords.create({
          booking_id,
          amount: booking.entry_fee,
          payment_method: payment_method || 'UPI / GPay',
          transaction_reference,
          screenshot_url: screenshot_url || '',
          verification_status: PAYMENT_STATUS.UNDER_VERIFICATION
        });
      }

      // Update booking status
      await db.bookings.update(booking_id, { status: BOOKING_STATUS.UNDER_VERIFICATION });

      // Notify tournament's Match Master
      const tournament = await db.tournaments.findById(booking.tournament_id);
      if (tournament && tournament.assigned_match_master_id) {
        await db.notifications.create({
          user_id: tournament.assigned_match_master_id,
          title: 'Payment Verification Requested',
          message: `Slot #${booking.slot_number} for ${booking.team_name} submitted UTR: ${transaction_reference} for verification.`,
          type: 'PAYMENT_PENDING',
          reference_id: booking.booking_reference
        });
      }

      res.status(201).json({
        success: true,
        message: 'Payment proof submitted. Your Match Master will verify and confirm your slot shortly.',
        payment: record
      });
    } catch (err) {
      next(err);
    }
  },

  // Match Master / Super Admin fetches payments
  getPayments: async (req, res, next) => {
    try {
      const { tournamentId, status } = req.query;
      let payments = await db.paymentRecords.getAll();

      // Filter by tournament if specified
      if (tournamentId) {
        const tournamentBookings = await db.bookings.findByTournamentId(tournamentId);
        const bookingIds = new Set(tournamentBookings.map(b => b.id));
        payments = payments.filter(p => bookingIds.has(p.booking_id));
      }

      // Filter by status if specified
      if (status) {
        payments = payments.filter(p => p.verification_status === status);
      }

      const enriched = await Promise.all(payments.map(async (p) => {
        const booking = await db.bookings.findById(p.booking_id);
        const player = booking ? await db.profiles.findById(booking.user_id) : null;
        const tournament = booking ? await db.tournaments.findById(booking.tournament_id) : null;
        const verifier = p.verified_by ? await db.profiles.findById(p.verified_by) : null;

        return {
          ...p,
          booking,
          player: player ? {
            id: player.id,
            username: player.username,
            full_name: player.full_name,
            email: player.email,
            mobile_number: player.mobile_number,
            in_game_id: player.in_game_id
          } : null,
          tournament: tournament ? {
            id: tournament.id,
            title: tournament.title,
            game_id: tournament.game_id
          } : null,
          verifier: verifier ? {
            username: verifier.username,
            staff_code: verifier.staff_code
          } : null
        };
      }));

      res.json({ success: true, payments: enriched });
    } catch (err) {
      next(err);
    }
  },

  // Match Master manually verifies external payment
  verifyPayment: async (req, res, next) => {
    try {
      const { id } = req.params;
      const payment = await db.paymentRecords.findById(id);
      if (!payment) {
        return res.status(404).json({ success: false, error: 'Payment record not found.' });
      }

      const booking = await db.bookings.findById(payment.booking_id);
      if (!booking) {
        return res.status(404).json({ success: false, error: 'Associated booking record not found.' });
      }

      const tournament = await db.tournaments.findById(booking.tournament_id);
      if (!tournament) {
        return res.status(404).json({ success: false, error: 'Tournament not found.' });
      }

      // Authorization check: Only assigned Match Master or Super Admin
      if (req.user.role !== 'SUPER_ADMIN' && tournament.assigned_match_master_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You are not authorized to verify payments for this tournament.'
        });
      }

      const now = new Date().toISOString();

      // 1. Update Payment Record
      const updatedPayment = await db.paymentRecords.update(id, {
        verification_status: PAYMENT_STATUS.VERIFIED,
        verified_by: req.user.id,
        verified_at: now,
        rejection_reason: null
      });

      // 2. Update Booking Status
      await db.bookings.update(booking.id, {
        status: BOOKING_STATUS.CONFIRMED,
        updated_at: now
      });

      // 3. Confirm Slot
      await db.slots.confirmSlot(booking.tournament_id, booking.slot_number, booking.id);

      // 4. Add to Tournament Participants
      await db.tournamentParticipants.add({
        tournament_id: booking.tournament_id,
        slot_number: booking.slot_number,
        user_id: booking.user_id,
        team_id: booking.team_id,
        team_name: booking.team_name,
        booking_id: booking.id
      });

      // 5. Send Notification to Player
      await db.notifications.create({
        user_id: booking.user_id,
        title: 'Payment Verified & Slot Confirmed! 🎉',
        message: `Your payment of ₹${booking.entry_fee} for Slot #${booking.slot_number} in ${tournament.title} has been officially verified by Match Master ${req.user.username}.`,
        type: 'PAYMENT_VERIFIED',
        reference_id: booking.booking_reference
      });

      // 6. Audit Log
      await db.auditLogs.create({
        actor_id: req.user.id,
        actor_role: req.user.role,
        action: 'PAYMENT_VERIFIED',
        target_type: 'PAYMENT',
        target_id: id,
        metadata: {
          booking_id: booking.id,
          tournament_id: tournament.id,
          slot_number: booking.slot_number,
          amount: payment.amount,
          squad: booking.team_name,
          utr: payment.transaction_reference
        }
      });

      // 7. Emit Real-time Socket Events
      const io = getIO();
      if (io) {
        io.emit('slot:updated', {
          tournament_id: booking.tournament_id,
          slot_number: booking.slot_number,
          status: SLOT_STATUS.BOOKED,
          team_name: booking.team_name
        });

        io.emit('payment:verified', {
          booking_id: booking.id,
          tournament_id: tournament.id,
          slot_number: booking.slot_number
        });
      }

      res.json({
        success: true,
        message: `Payment verified. Slot #${booking.slot_number} is now confirmed for ${booking.team_name}.`,
        payment: updatedPayment
      });
    } catch (err) {
      next(err);
    }
  },

  // Match Master rejects payment with a mandatory reason
  rejectPayment: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;

      if (!rejection_reason || rejection_reason.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'A detailed rejection reason is mandatory when rejecting payment.'
        });
      }

      const payment = await db.paymentRecords.findById(id);
      if (!payment) {
        return res.status(404).json({ success: false, error: 'Payment record not found.' });
      }

      const booking = await db.bookings.findById(payment.booking_id);
      if (!booking) {
        return res.status(404).json({ success: false, error: 'Associated booking not found.' });
      }

      const tournament = await db.tournaments.findById(booking.tournament_id);
      if (req.user.role !== 'SUPER_ADMIN' && tournament.assigned_match_master_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You are not authorized to manage payments for this tournament.'
        });
      }

      // Update payment record
      const updatedPayment = await db.paymentRecords.update(id, {
        verification_status: PAYMENT_STATUS.REJECTED,
        verified_by: req.user.id,
        verified_at: new Date().toISOString(),
        rejection_reason: rejection_reason.trim()
      });

      // Update booking and release slot
      await db.bookings.update(booking.id, {
        status: BOOKING_STATUS.REJECTED,
        rejection_reason: rejection_reason.trim()
      });

      await db.slots.releaseSlot(booking.tournament_id, booking.slot_number);

      // Send notification to player
      await db.notifications.create({
        user_id: booking.user_id,
        title: 'Payment Verification Rejected',
        message: `Your payment verification for Slot #${booking.slot_number} in ${tournament.title} was rejected. Reason: "${rejection_reason.trim()}". Slot has been released.`,
        type: 'PAYMENT_REJECTED',
        reference_id: booking.booking_reference
      });

      // Audit Log
      await db.auditLogs.create({
        actor_id: req.user.id,
        actor_role: req.user.role,
        action: 'PAYMENT_REJECTED',
        target_type: 'PAYMENT',
        target_id: id,
        metadata: {
          booking_id: booking.id,
          reason: rejection_reason,
          slot_number: booking.slot_number
        }
      });

      // Emit real-time slot release
      const io = getIO();
      if (io) {
        io.emit('slot:updated', {
          tournament_id: booking.tournament_id,
          slot_number: booking.slot_number,
          status: SLOT_STATUS.AVAILABLE
        });
      }

      res.json({
        success: true,
        message: 'Payment rejected and slot released safely.',
        payment: updatedPayment
      });
    } catch (err) {
      next(err);
    }
  }
};
