import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import RoleBadge from '../components/RoleBadge.jsx';

export default function PlayerDashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [utrModalBooking, setUtrModalBooking] = useState(null);
  const [utrInput, setUtrInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI / GPay');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const res = await api.get('/bookings/my');
      if (res.data?.success) {
        setBookings(res.data.bookings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!utrModalBooking || !utrInput.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post('/payments', {
        booking_id: utrModalBooking.id,
        transaction_reference: utrInput.trim(),
        payment_method: paymentMethod
      });
      if (res.data?.success) {
        setFeedback(`Payment proof submitted for Slot #${utrModalBooking.slot_number}. Match Master notified.`);
        setUtrModalBooking(null);
        setUtrInput('');
        loadBookings();
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full pt-20 bg-background flex-1 flex flex-col justify-between pb-space-3xl">
      <div className="w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin py-space-md flex flex-col gap-space-lg">
        
        {/* Welcome Banner */}
        <section className="w-full bg-surface-container-low rounded-xl p-space-lg border border-outline-variant/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/40"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-headline-lg text-headline-lg uppercase font-bold text-on-surface">
                  {user?.username}
                </h1>
                <RoleBadge role={user?.role} staffCode={user?.staff_code} />
              </div>
              <span className="text-body-sm text-on-surface-variant">
                {user?.full_name} • Player UID: <strong className="text-on-surface font-label-numeric">{user?.in_game_id || 'Not Linked'}</strong>
              </span>
              <span className="text-[11px] font-label-caption text-primary uppercase mt-0.5">
                Registered Contact: {user?.mobile_number} ({user?.email})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Link
              to="/tournaments"
              className="px-4 py-2.5 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary font-headline-sm text-body-sm uppercase font-bold transition-all shadow-md"
            >
              Explore Scrims
            </Link>
            {user?.role === 'PLAYER' && (
              <Link
                to="/team"
                className="px-4 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-headline-sm text-body-sm uppercase font-bold transition-all border border-outline-variant/30"
              >
                Create Squad
              </Link>
            )}
          </div>
        </section>

        {feedback && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-body-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{feedback}</span>
            </div>
            <button onClick={() => setFeedback('')} className="text-xs uppercase hover:underline">Dismiss</button>
          </div>
        )}

        {/* Telemetry Overview Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
          <div className="p-space-md rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-1 shadow-md">
            <span className="text-[11px] font-label-caption text-on-surface-variant uppercase">Total Bookings</span>
            <span className="font-display-hero text-headline-lg font-bold text-on-surface">{bookings.length}</span>
            <span className="text-[11px] text-emerald-400 font-semibold">Active Circuit History</span>
          </div>
          <div className="p-space-md rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-1 shadow-md">
            <span className="text-[11px] font-label-caption text-on-surface-variant uppercase">Confirmed Slots</span>
            <span className="font-display-hero text-headline-lg font-bold text-emerald-400">
              {bookings.filter(b => b.status === 'CONFIRMED').length}
            </span>
            <span className="text-[11px] text-on-surface-variant">Ready for Match Drop</span>
          </div>
          <div className="p-space-md rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-1 shadow-md">
            <span className="text-[11px] font-label-caption text-on-surface-variant uppercase">Pending Verification</span>
            <span className="font-display-hero text-headline-lg font-bold text-amber-400">
              {bookings.filter(b => b.status === 'UNDER_VERIFICATION' || b.status === 'PAYMENT_PENDING').length}
            </span>
            <span className="text-[11px] text-amber-400/80">With Match Master</span>
          </div>
          <div className="p-space-md rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-1 shadow-md">
            <span className="text-[11px] font-label-caption text-on-surface-variant uppercase">Fair Play Score</span>
            <span className="font-display-hero text-headline-lg font-bold text-primary">100%</span>
            <span className="text-[11px] text-on-surface-variant">Touch Hardware Polled</span>
          </div>
        </section>

        {/* MY ACTIVE BOOKINGS TABLE */}
        <section className="flex flex-col gap-space-md">
          <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">confirmation_number</span>
              <h2 className="font-headline-lg text-headline-lg uppercase font-bold text-on-surface tracking-tight">
                My Tournament Bookings & Payment Slips
              </h2>
            </div>
            <span className="text-body-sm text-on-surface-variant">
              External payments verified manually by assigned Match Masters
            </span>
          </div>

          <div className="rounded-xl bg-surface-container border border-outline-variant/30 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead className="bg-surface-container-high border-b border-outline-variant/30 font-label-badge text-[11px] uppercase text-on-surface-variant">
                  <tr>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Tournament</th>
                    <th className="py-3 px-4">Slot</th>
                    <th className="py-3 px-4">Squad Name</th>
                    <th className="py-3 px-4">Entry Fee</th>
                    <th className="py-3 px-4">Booking Status</th>
                    <th className="py-3 px-4">Payment UTR</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-on-surface-variant">
                        <span className="block text-headline-sm font-bold uppercase mb-1">No Bookings Yet</span>
                        <p className="text-body-sm text-outline max-w-sm mx-auto mb-4">
                          Select a tournament from the hub to reserve your squad slot and coordinate with the Match Master.
                        </p>
                        <Link
                          to="/tournaments"
                          className="px-4 py-2 rounded-lg bg-primary-container text-on-primary font-headline-sm text-body-sm uppercase font-bold shadow"
                        >
                          Explore Tournaments
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => {
                      const isConfirmed = b.status === 'CONFIRMED';
                      const isPending = b.status === 'PAYMENT_PENDING' || b.status === 'UNDER_VERIFICATION';
                      const isRejected = b.status === 'REJECTED';

                      return (
                        <tr key={b.id} className="hover:bg-surface-container-high/60 transition-colors">
                          <td className="py-3 px-4 font-label-numeric font-bold text-primary">
                            {b.booking_reference}
                          </td>
                          <td className="py-3 px-4 font-headline-sm uppercase font-bold text-on-surface">
                            {b.tournament?.title || b.tournament_id}
                          </td>
                          <td className="py-3 px-4 font-label-numeric font-bold text-on-surface">
                            Slot #{b.slot_number}
                          </td>
                          <td className="py-3 px-4 text-on-surface font-semibold">{b.team_name}</td>
                          <td className="py-3 px-4 font-label-numeric font-bold text-primary">
                            ₹{b.entry_fee}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-label-badge uppercase ${
                                isConfirmed
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
                                  : isPending
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold animate-pulse'
                                  : isRejected
                                  ? 'bg-error-container/30 text-error border border-error/30'
                                  : 'bg-surface-container-high text-on-surface-variant'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-label-numeric text-xs">
                            {b.payment?.transaction_reference ? (
                              <span className="font-mono bg-surface-container-low px-2 py-0.5 rounded">
                                {b.payment.transaction_reference}
                              </span>
                            ) : (
                              <button
                                onClick={() => setUtrModalBooking(b)}
                                className="text-primary hover:underline font-semibold"
                              >
                                + Submit UTR
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isConfirmed && (
                                <Link
                                  to={`/room/${b.tournament_id}`}
                                  className="px-3 py-1 rounded bg-primary-container text-on-primary font-label-badge text-label-badge uppercase font-bold hover:bg-secondary-container shadow"
                                >
                                  Enter Room
                                </Link>
                              )}
                              {b.whatsapp_message && (
                                <a
                                  href={`https://wa.me/919876543210?text=${encodeURIComponent(b.whatsapp_message)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 rounded bg-surface-container-high hover:bg-surface-bright text-emerald-400 transition-colors"
                                  title="WhatsApp Coordinator"
                                >
                                  <span className="material-symbols-outlined text-[16px]">chat</span>
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SUBMIT UTR MODAL */}
        {utrModalBooking && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleSubmitProof} className="bg-surface-container border border-outline-variant/40 rounded-xl p-space-lg max-w-md w-full shadow-2xl flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <span className="font-headline-sm text-headline-sm text-primary uppercase font-bold">
                  Submit Payment Reference (UTR)
                </span>
                <button type="button" onClick={() => setUtrModalBooking(null)} className="text-on-surface-variant hover:text-on-surface">
                  ✕
                </button>
              </div>

              <p className="text-body-sm text-on-surface-variant">
                Submitting your transaction reference for Slot #{utrModalBooking.slot_number} (Ref: {utrModalBooking.booking_reference}).
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-label-numeric uppercase text-on-surface">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 text-body-sm font-semibold"
                >
                  <option value="UPI / GPay">UPI / Google Pay</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="Paytm">Paytm</option>
                  <option value="IMPS / Bank Transfer">IMPS / Net Banking</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-label-numeric uppercase text-on-surface">12-Digit UTR Number</label>
                <input
                  type="text"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="e.g. 409281920194"
                  required
                  className="h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 text-body-sm font-label-numeric"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUtrModalBooking(null)}
                  className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-body-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary font-headline-sm text-body-sm uppercase font-bold"
                >
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
