import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getSocket } from '../services/socket.js';
import SlotBadge from '../components/SlotBadge.jsx';

export default function SlotBookingPage() {
  const { id: tournamentId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [bookingResult, setBookingResult] = useState(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI / GPay');
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTournamentAndSlots();

    // Listen to real-time slot updates via Socket.IO
    const socket = getSocket();
    socket.on('slot:updated', (data) => {
      if (data.tournament_id === tournamentId) {
        setSlots(prev => prev.map(s => {
          if (s.slot_number === data.slot_number) {
            return { ...s, status: data.status, held_until: data.held_until };
          }
          return s;
        }));
      }
    });

    return () => {
      socket.off('slot:updated');
    };
  }, [tournamentId]);

  useEffect(() => {
    if (user?.team) {
      setTeamName(user.team.name);
    } else if (user?.username) {
      setTeamName(`${user.username}'s Squad`);
    }
  }, [user]);

  const loadTournamentAndSlots = async () => {
    try {
      const res = await api.get(`/tournaments/${tournamentId}`);
      if (res.data?.success) {
        setTournament(res.data.tournament);
        setSlots(res.data.tournament.slots || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load tournament slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (slot) => {
    if (slot.status === 'BOOKED') {
      alert(`Slot #${slot.slot_number} is already booked.`);
      return;
    }
    if (slot.status === 'HELD' && slot.held_by_user_id !== user?.id) {
      alert(`Slot #${slot.slot_number} is currently held by another squad. Please select an available slot.`);
      return;
    }
    setSelectedSlot(slot.slot_number);
    setError('');
  };

  const handleReserveSlot = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedSlot) {
      setError('Please select a slot number first.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/api/bookings', {
        tournament_id: tournamentId,
        slot_number: selectedSlot,
        team_name: teamName || `${user.username}'s Squad`
      });

      if (res.data?.success) {
        setBookingResult(res.data);
        // Automatically open WhatsApp in new tab
        if (res.data.whatsappUrl) {
          window.open(res.data.whatsappUrl, '_blank');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Booking reservation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPaymentProof = async (e) => {
    e.preventDefault();
    if (!bookingResult?.booking?.id || !utrNumber) return;

    setSubmitting(true);
    try {
      const res = await api.post('/api/payments', {
        booking_id: bookingResult.booking.id,
        transaction_reference: utrNumber.trim(),
        payment_method: paymentMethod
      });

      if (res.data?.success) {
        setPaymentSubmitted(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <span className="font-label-badge text-primary uppercase animate-pulse">CONNECTING TO SLOTS NODE...</span>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="pt-28 text-center min-h-[60vh]">
        <h2 className="text-headline-lg font-bold">Tournament Not Found</h2>
        <Link to="/" className="text-primary mt-4 inline-block hover:underline">Return to Hub</Link>
      </div>
    );
  }

  const bookedCount = slots.filter(s => s.status === 'BOOKED').length;
  const heldCount = slots.filter(s => s.status === 'HELD').length;
  const availableCount = slots.filter(s => s.status === 'AVAILABLE').length;
  const fillPct = Math.round((bookedCount / tournament.max_participants) * 100);

  return (
    <div className="w-full pt-20 bg-background flex-1 flex flex-col justify-between pb-space-3xl">
      {/* ATMOSPHERIC GLOW UNDERLAY */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[360px] bg-gradient-to-b from-primary-container/20 via-tertiary-container/10 to-transparent blur-3xl pointer-events-none rounded-full"></div>

        <div className="relative w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin py-space-xl flex flex-col gap-space-2xl">
          
          {/* Top Telemetry & Clock */}
          <section className="flex flex-col gap-space-lg">
            <div className="flex flex-wrap items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-xs p-1 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <span className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-headline-sm text-body-sm font-bold shadow-sm">
                  {tournament.game_id.toUpperCase()} ({tournament.max_participants} SLOTS)
                </span>
                <span className="px-3 py-1.5 font-label-badge text-label-badge text-on-surface-variant uppercase">
                  {tournament.start_time_ist}
                </span>
              </div>

              <div className="flex items-center gap-space-sm px-space-md py-2 rounded-xl bg-surface-container border border-outline-variant/30 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-ping"></span>
                <span className="font-label-badge text-label-badge text-on-surface-variant uppercase tracking-wider">
                  Session IST:
                </span>
                <span className="font-label-numeric text-headline-sm text-primary tracking-tight font-bold">
                  {tournament.start_time_ist}
                </span>
                <span className="font-label-caption text-label-caption px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface">
                  {tournament.tournament_date}
                </span>
              </div>
            </div>

            {/* Master Tournament Hero Card */}
            <div className="relative overflow-hidden rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-low/95 to-surface-container-lowest/80 pointer-events-none z-10"></div>
              
              <div className="absolute inset-0 z-0 opacity-20">
                <img
                  className="w-full h-full object-cover"
                  src={tournament.banner_url}
                  alt={tournament.title}
                />
              </div>

              <div className="relative z-20 p-space-lg sm:p-space-xl flex flex-col lg:flex-row lg:items-center justify-between gap-space-xl">
                <div className="flex flex-col gap-space-sm max-w-3xl">
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <span className="px-space-xs py-0.5 rounded bg-primary-container/20 text-primary font-label-badge text-label-badge uppercase font-bold">
                      OFFICIAL BRACKET #{tournament.id}
                    </span>
                    <span className="flex items-center gap-1 px-space-xs py-0.5 rounded bg-surface-container-high text-emerald-400 font-label-caption text-label-caption">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      MATCH MASTER VERIFIED
                    </span>
                  </div>

                  <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-extrabold uppercase">
                    {tournament.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-space-lg text-on-surface-variant font-body-md">
                    <span className="flex items-center gap-1.5 text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-primary">map</span>
                      Erangel • Livik • Rondo • Miramar
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-primary">payments</span>
                      <strong className="text-on-surface">₹{tournament.entry_fee}</strong> / Squad
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-primary">trophy</span>
                      Prize Pool: <strong className="text-primary font-label-numeric">₹12,000</strong>
                    </span>
                  </div>

                  {/* Guaranteed Prize Distribution */}
                  <div className="mt-space-xs p-3 rounded-xl bg-surface-container-high/80 border border-primary/40 max-w-xl flex flex-col gap-1.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-primary font-label-badge font-bold uppercase text-[11px] tracking-wider">
                        <span className="material-symbols-outlined text-[16px]">military_tech</span>
                        OFFICIAL PRIZE DISTRIBUTION
                      </div>
                      <span className="font-label-numeric text-[12px] font-bold text-on-surface">Pool: ₹12,000</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
                      <div className="p-2 rounded-lg bg-surface-container border border-outline-variant/30 flex flex-col">
                        <span className="text-[10px] text-primary uppercase font-bold">1st Prize</span>
                        <span className="font-headline-sm text-primary font-bold">₹5,000</span>
                      </div>
                      <div className="p-2 rounded-lg bg-surface-container border border-outline-variant/30 flex flex-col">
                        <span className="text-[10px] text-on-surface-variant uppercase font-bold">2nd Prize</span>
                        <span className="font-headline-sm text-on-surface font-bold">₹3,000</span>
                      </div>
                      <div className="p-2 rounded-lg bg-surface-container border border-outline-variant/30 flex flex-col">
                        <span className="text-[10px] text-on-surface-variant uppercase font-bold">3rd Prize</span>
                        <span className="font-headline-sm text-on-surface font-bold">₹2,000</span>
                      </div>
                      <div className="p-2 rounded-lg bg-surface-container border border-outline-variant/30 flex flex-col">
                        <span className="text-[10px] text-on-surface-variant uppercase font-bold">4th & 5th</span>
                        <span className="font-headline-sm text-on-surface font-bold">₹1,000 <span className="text-[10px] text-on-surface-variant font-normal">ea</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Match Master Card Inline */}
                  <div className="mt-space-xs flex items-center gap-space-md p-space-sm rounded-lg bg-surface-container-lowest/80 backdrop-blur-md max-w-xl border border-outline-variant/30">
                    <div className="relative shrink-0">
                      <img
                        className="w-10 h-10 rounded-full object-cover"
                        src={tournament.matchMaster?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAq9nwc2OPZfFJBjl-vsUYbQYzOuTNBiC9i2sj8c01LgqFd30zQX_R6QlkTtsxHdgkzhl6aveDHC6p-UcgH7QAfby-6xiRFiyG7ku1810AyWLC_VCYdNQ1dE2VZ_PXtph7CexLedT4r5GMhZiHfHqnyzcDJpVkeqNBd7Vc-h0VAPqcr5dOYbK5gpRtH0YTSaRzajgEU6eM-c-FIrhRv1ysw3PYdoK1GBRYTJkzV0bU'}
                        alt="Match Master"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-surface-container-lowest"></span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-space-2xs">
                        <span className="font-headline-sm text-headline-sm text-on-surface truncate font-bold">
                          {tournament.matchMaster?.username || 'Vikram_Ops'}
                        </span>
                        <span className="font-label-caption text-label-caption text-primary">
                          {tournament.matchMaster?.staff_code || '#MM-409'}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                        Assigned Match Master • Manual Verification via WhatsApp
                      </span>
                    </div>
                  </div>
                </div>

                {/* Capacity Gauge Tile */}
                <div className="flex flex-col p-space-lg rounded-xl bg-surface-container/90 backdrop-blur-md min-w-[280px] shadow-lg border border-outline-variant/30">
                  <div className="flex items-center justify-between">
                    <span className="font-label-badge text-label-badge text-on-surface-variant uppercase">
                      Grid Saturation
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary font-label-badge text-label-badge animate-pulse">
                      {availableCount} SLOTS REMAINING
                    </span>
                  </div>
                  <div className="mt-space-sm flex items-baseline gap-space-2xs">
                    <span className="font-display-hero text-display-hero text-on-surface tracking-tight leading-none font-bold">
                      {bookedCount}
                    </span>
                    <span className="font-headline-md text-headline-md text-on-surface-variant">
                      / {tournament.max_participants}
                    </span>
                    <span className="ml-auto font-label-numeric text-label-numeric text-primary font-bold">
                      {fillPct}%
                    </span>
                  </div>
                  <div className="mt-space-sm w-full h-2.5 rounded-full bg-surface-container-lowest overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary via-primary-container to-secondary-container rounded-full"
                      style={{ width: `${fillPct}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 16-SLOT INTERACTIVE GRID */}
          <section className="flex flex-col gap-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-xs border-b border-outline-variant/20">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[22px]">grid_view</span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface uppercase font-bold tracking-tight">
                  Tactical Slot Matrix ({tournament.max_participants} Slots)
                </h2>
              </div>
              <div className="flex items-center gap-space-md flex-wrap text-body-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span className="text-on-surface-variant">Available ({availableCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                  <span className="text-on-surface-variant">Held / Verifying ({heldCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                  <span className="text-on-surface-variant">Confirmed / Booked ({bookedCount})</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-error-container/30 border border-error/50 text-error text-body-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-space-sm">
              {slots.map((slot) => {
                const isSelected = selectedSlot === slot.slot_number;
                const isBooked = slot.status === 'BOOKED';
                const isHeld = slot.status === 'HELD';
                const isAvailable = slot.status === 'AVAILABLE';

                return (
                  <button
                    key={slot.slot_number}
                    type="button"
                    onClick={() => handleSlotClick(slot)}
                    disabled={isBooked}
                    className={`relative p-space-md rounded-xl text-left flex flex-col justify-between min-h-[120px] transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-primary-container/20 border-primary shadow-[0_0_16px_rgba(249,115,22,0.35)] scale-[1.02]'
                        : isBooked
                        ? 'bg-surface-container-high/60 border-primary-container/40 opacity-90 cursor-not-allowed'
                        : isHeld
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-surface-container hover:bg-surface-container-high border-outline-variant/30 hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-display-hero text-headline-lg font-bold leading-none text-on-surface">
                        {slot.slot_number < 10 ? `0${slot.slot_number}` : slot.slot_number}
                      </span>
                      {isBooked ? (
                        <span className="material-symbols-outlined text-primary text-[18px]">lock</span>
                      ) : isHeld ? (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                      ) : (
                        <span className="material-symbols-outlined text-emerald-400 text-[18px]">radio_button_unchecked</span>
                      )}
                    </div>

                    <div className="flex flex-col mt-2">
                      <span className="font-headline-sm text-[12px] font-bold truncate text-on-surface uppercase">
                        {isBooked
                          ? (slot.team_name || `Squad #${slot.slot_number}`)
                          : isHeld
                          ? 'Held (10m Hold)'
                          : 'Available'}
                      </span>
                      <SlotBadge status={slot.status} className="mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* BOOKING ACTION DOCK / CONFIRMATION MODAL */}
          <section className="rounded-xl bg-surface-container-low border border-outline-variant/30 p-space-lg shadow-2xl flex flex-col gap-space-md">
            {!bookingResult ? (
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
                <div className="flex flex-col gap-1">
                  <span className="font-label-badge text-label-badge text-primary uppercase font-bold">
                    STEP 1: SELECT AVAILABLE SLOT & GENERATE WHATSAPP DIRECT
                  </span>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface uppercase font-bold">
                    {selectedSlot ? `Selected Slot #${selectedSlot}` : 'Choose a Slot Above to Reserve'}
                  </h3>
                  <p className="text-body-sm text-on-surface-variant max-w-xl">
                    Once reserved, your slot is temporarily locked for 10 minutes. Click below to open WhatsApp with pre-filled details to verify external payment with Match Master Vikram_Ops.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-space-md">
                  <div className="flex flex-col">
                    <label className="text-[11px] font-label-numeric uppercase text-on-surface-variant">Squad Name</label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. TEAM GODLIKE"
                      className="h-11 px-3.5 bg-surface-container text-on-surface rounded-lg border border-outline-variant/40 focus:border-primary text-body-sm"
                    />
                  </div>

                  <button
                    onClick={handleReserveSlot}
                    disabled={!selectedSlot || submitting}
                    className="h-11 px-6 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary font-headline-sm text-body-sm uppercase font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer self-end"
                  >
                    {submitting ? (
                      <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                        <span>Lock Slot & Open WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* POST-RESERVATION PAYMENT SUBMISSION DOCK */
              <div className="flex flex-col gap-space-md bg-surface-container p-space-md rounded-xl border border-primary/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-sm border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-[24px]">verified</span>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-headline-sm text-on-surface uppercase font-bold">
                        Slot #{bookingResult.booking.slot_number} Reserved! (Ref: {bookingResult.booking.booking_reference})
                      </span>
                      <span className="text-body-sm text-primary font-label-numeric">
                        Temporary 10-Minute Hold Active • Contact Match Master on WhatsApp
                      </span>
                    </div>
                  </div>

                  <a
                    href={bookingResult.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-headline-sm text-body-sm uppercase font-bold transition-all shadow"
                  >
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                    <span>Re-Open WhatsApp Click-to-Chat</span>
                  </a>
                </div>

                {!paymentSubmitted ? (
                  <form onSubmit={handleSubmitPaymentProof} className="flex flex-col gap-space-sm">
                    <span className="font-label-badge text-label-badge uppercase text-on-surface tracking-wider font-bold">
                      STEP 2: SUBMIT EXTERNAL PAYMENT REFERENCE (UTR) FOR FAST VERIFICATION
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-label-numeric uppercase text-on-surface-variant">Payment Method</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="h-11 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 text-body-sm"
                        >
                          <option value="UPI / GPay">UPI / Google Pay</option>
                          <option value="PhonePe">PhonePe</option>
                          <option value="Paytm">Paytm</option>
                          <option value="IMPS / Bank Transfer">IMPS / Net Banking</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="text-[11px] font-label-numeric uppercase text-on-surface-variant">12-Digit UTR / Transaction Reference ID</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value)}
                            placeholder="e.g. 409281920194"
                            required
                            className="flex-1 h-11 px-3.5 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 text-body-sm font-label-numeric"
                          />
                          <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 h-11 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary font-headline-sm text-body-sm uppercase font-bold transition-all cursor-pointer disabled:opacity-50"
                          >
                            Submit Proof
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="p-space-md rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">mark_email_read</span>
                      <span className="font-semibold text-body-sm">
                        UTR Submitted ({utrNumber}). Match Master Vikram_Ops will independently verify external payment and confirm your slot.
                      </span>
                    </div>
                    <Link
                      to="/dashboard"
                      className="px-3 py-1 rounded bg-surface-container text-on-surface font-label-badge text-label-badge uppercase hover:bg-surface-container-high transition-colors"
                    >
                      View in My Bookings
                    </Link>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
