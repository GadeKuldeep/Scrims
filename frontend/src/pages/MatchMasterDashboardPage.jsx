import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import SlotBadge from '../components/SlotBadge.jsx';

export default function MatchMasterDashboardPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('BGMI-2100');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'UNDER_VERIFICATION', 'VERIFIED', 'REJECTED'

  // Modal / Drawer State
  const [activePayment, setActivePayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedTournament]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([
        api.get('/payments', { params: { tournamentId: selectedTournament } }),
        api.get('/tournaments')
      ]);

      if (pRes.data?.success) setPayments(pRes.data.payments);
      if (tRes.data?.success) setTournaments(tRes.data.tournaments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/payments/${paymentId}/verify`);
      if (res.data?.success) {
        setFeedback(res.data.message);
        setActivePayment(null);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (paymentId) => {
    if (!rejectionReason.trim()) {
      alert('A detailed rejection reason is mandatory.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post(`/payments/${paymentId}/reject`, {
        rejection_reason: rejectionReason.trim()
      });
      if (res.data?.success) {
        setFeedback(res.data.message);
        setActivePayment(null);
        setIsRejecting(false);
        setRejectionReason('');
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    try {
      await api.post(`/chat/${selectedTournament}/messages`, {
        message: broadcastMessage.trim(),
        message_type: 'ANNOUNCEMENT'
      });
      setBroadcastMessage('');
      setBroadcastOpen(false);
      setFeedback('Official Announcement Broadcasted to Tournament Room.');
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const currentTourn = tournaments.find(t => t.id === selectedTournament);
  const pendingCount = payments.filter(p => p.verification_status === 'UNDER_VERIFICATION').length;
  const verifiedCount = payments.filter(p => p.verification_status === 'VERIFIED').length;
  const verifiedAmount = payments.filter(p => p.verification_status === 'VERIFIED').reduce((s, p) => s + Number(p.amount), 0);

  const filteredPayments = payments.filter(p => {
    if (filterStatus === 'ALL') return true;
    return p.verification_status === filterStatus;
  });

  return (
    <div className="w-full pt-20 bg-background flex-1 flex flex-col justify-between pb-space-3xl">
      <div className="w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin py-space-md flex flex-col gap-space-lg">
        
        {/* Top Bar: Operational Status & Match Master Marshal Identity */}
        <section className="w-full bg-surface-container-low rounded-xl p-space-md shadow-xl border border-outline-variant/30 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary-container/10 blur-3xl pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md relative z-10">
            {/* Staff Identity & Shift Context */}
            <div className="flex items-center gap-space-md">
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-surface-container-high flex items-center justify-center border border-outline-variant/40 shadow-inner">
                  <span className="material-symbols-outlined text-primary text-[30px]">shield_person</span>
                </div>
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-surface-container-low animate-pulse"></span>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs flex-wrap">
                  <span className="font-headline-sm text-headline-sm text-on-surface tracking-wide font-bold">
                    {user?.full_name || user?.username}
                  </span>
                  <span className="px-space-xs py-0.5 rounded bg-primary-container/20 text-primary font-label-badge text-label-badge uppercase font-bold">
                    {user?.staff_code || '#MM-409'}
                  </span>
                  <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-badge text-label-badge uppercase">
                    SR. MATCH MARSHAL
                  </span>
                </div>

                <div className="flex items-center gap-space-sm text-on-surface-variant font-body-sm text-body-sm mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1 text-on-surface font-semibold">
                    <span className="material-symbols-outlined text-[15px] text-primary">sports_esports</span>
                    {currentTourn?.title || 'BGMI Master Cup Series #BGMI-2100'}
                  </span>
                  <span>•</span>
                  <span>Erangel / Livik / Rondo</span>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-label-numeric text-label-numeric text-primary font-bold">
                    T-MINUS 29M TO LOBBY
                  </span>
                </div>
              </div>
            </div>

            {/* Master Actions & Telemetry Strip */}
            <div className="flex items-center gap-space-sm flex-wrap self-start lg:self-center">
              <div className="bg-surface-container px-space-md py-space-xs rounded-lg flex items-center gap-space-sm shadow-sm border border-outline-variant/30">
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">lock_clock</span>
                <div className="flex flex-col">
                  <span className="font-label-caption text-label-caption text-on-surface-variant uppercase">Lobby Capacity</span>
                  <span className="font-label-numeric text-label-numeric text-on-surface font-bold">
                    {verifiedCount} / {currentTourn?.max_participants || 16} SLOTS VERIFIED
                  </span>
                </div>
              </div>

              <div className="bg-surface-container px-space-md py-space-xs rounded-lg flex items-center gap-space-sm shadow-sm border border-outline-variant/30">
                <span className="material-symbols-outlined text-primary text-[18px]">currency_rupee</span>
                <div className="flex flex-col">
                  <span className="font-label-caption text-label-caption text-on-surface-variant uppercase">
                    Expected Gross Collection: ₹{currentTourn?.stats?.expectedGrossEntry || 19200}
                  </span>
                  <span className="font-label-numeric text-label-numeric text-primary font-bold">
                    VERIFIED PAYMENTS: ₹{verifiedAmount}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setBroadcastOpen(true)}
                className="flex items-center gap-space-2xs px-space-md py-2.5 rounded-lg bg-primary-container text-on-primary font-headline-sm text-body-sm hover:brightness-110 transition-all shadow-md cursor-pointer font-bold"
              >
                <span className="material-symbols-outlined text-[18px]">cell_tower</span>
                <span>Broadcast Announcement</span>
              </button>
            </div>
          </div>

          {/* Quick Operational Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-space-sm mt-space-md pt-space-sm bg-surface-container-lowest/60 -mx-space-md -mb-space-md px-space-md py-space-sm border-t border-outline-variant/20">
            <div className="flex flex-col">
              <span className="font-label-caption text-label-caption text-on-surface-variant uppercase">Assigned Matches</span>
              <span className="font-headline-sm text-headline-sm text-on-surface mt-0.5 font-bold">
                4 <span className="text-body-sm text-emerald-400 font-normal">Active Today</span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caption text-label-caption text-on-surface-variant uppercase">Pending UPI Proofs</span>
              <span className="font-headline-sm text-headline-sm text-amber-400 mt-0.5 font-bold">
                {pendingCount < 10 ? `0${pendingCount}` : pendingCount} <span className="text-body-sm text-amber-400/80 font-normal">Needs Audit</span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caption text-label-caption text-on-surface-variant uppercase">Confirmed Bookings</span>
              <span className="font-headline-sm text-headline-sm text-emerald-400 mt-0.5 font-bold">
                {verifiedCount} <span className="text-body-sm text-on-surface-variant font-normal">/ {currentTourn?.max_participants || 16} Slots</span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caption text-label-caption text-on-surface-variant uppercase">Lobby State</span>
              <span className="font-headline-sm text-headline-sm text-primary mt-0.5 font-bold">
                {currentTourn?.is_room_unlocked ? 'UNLOCKED' : 'STAGED'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caption text-label-caption text-on-surface-variant uppercase">Audit Speed</span>
              <span className="font-headline-sm text-headline-sm text-on-surface mt-0.5 font-bold">
                1.4 <span className="text-body-sm text-emerald-400 font-normal">Min / Slip</span>
              </span>
            </div>
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

        {/* BOOKINGS & PAYMENT VERIFICATION QUEUE */}
        <section className="flex flex-col gap-space-md">
          {/* Table Controls: Tournament Switcher & Filter Pills */}
          <div className="bg-surface-container-low rounded-xl p-space-md border border-outline-variant/30 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-xs flex-wrap">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-lg font-label-badge text-label-badge uppercase tracking-wider transition-all ${
                  filterStatus === 'ALL'
                    ? 'bg-primary-container text-on-primary font-bold shadow'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All Records ({payments.length})
              </button>
              <button
                onClick={() => setFilterStatus('UNDER_VERIFICATION')}
                className={`px-3 py-1.5 rounded-lg font-label-badge text-label-badge uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  filterStatus === 'UNDER_VERIFICATION'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                    : 'bg-surface-container text-amber-300/80 hover:bg-surface-container-high'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                <span>Needs Audit ({pendingCount})</span>
              </button>
              <button
                onClick={() => setFilterStatus('VERIFIED')}
                className={`px-3 py-1.5 rounded-lg font-label-badge text-label-badge uppercase tracking-wider transition-all ${
                  filterStatus === 'VERIFIED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-bold'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Verified ({verifiedCount})
              </button>
            </div>

            {/* Tournament Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-label-caption text-on-surface-variant uppercase">Switch Tournament:</span>
              <select
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
                className="h-9 px-3 bg-surface-container text-on-surface rounded-lg border border-outline-variant/30 text-body-sm font-semibold"
              >
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>
                    #{t.id} — {t.title.slice(0, 32)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payments & Bookings Data Table */}
          <div className="rounded-xl bg-surface-container border border-outline-variant/30 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead className="bg-surface-container-high border-b border-outline-variant/30 font-label-badge text-[11px] uppercase text-on-surface-variant">
                  <tr>
                    <th className="py-3 px-4">Slot</th>
                    <th className="py-3 px-4">Squad Name</th>
                    <th className="py-3 px-4">Captain / Contact</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Transaction UTR</th>
                    <th className="py-3 px-4">Verification Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-on-surface-variant">
                        No payment records matching the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => {
                      const isPending = p.verification_status === 'UNDER_VERIFICATION';
                      const isVerified = p.verification_status === 'VERIFIED';
                      const isRejected = p.verification_status === 'REJECTED';

                      return (
                        <tr key={p.id} className="hover:bg-surface-container-high/60 transition-colors">
                          <td className="py-3 px-4 font-label-numeric font-bold text-on-surface">
                            Slot #{p.booking?.slot_number || '-'}
                          </td>
                          <td className="py-3 px-4 font-headline-sm uppercase font-bold text-on-surface">
                            {p.booking?.team_name || 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-on-surface">{p.player?.username || 'Player'}</span>
                              <span className="text-[11px] text-on-surface-variant">{p.player?.mobile_number}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-label-numeric font-bold text-primary">
                            ₹{p.amount}
                          </td>
                          <td className="py-3 px-4 text-on-surface">{p.payment_method}</td>
                          <td className="py-3 px-4 font-label-numeric font-mono text-xs bg-surface-container-low px-2 py-1 rounded inline-block">
                            {p.transaction_reference}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-label-badge uppercase ${
                                isVerified
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : isPending
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse font-bold'
                                  : 'bg-error-container/30 text-error border border-error/30'
                              }`}
                            >
                              {p.verification_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleVerify(p.id)}
                                    disabled={actionLoading}
                                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-label-badge text-[11px] uppercase font-bold transition-all shadow"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActivePayment(p);
                                      setIsRejecting(true);
                                    }}
                                    className="px-2.5 py-1 rounded bg-error-container/60 hover:bg-error text-white font-label-badge text-[11px] uppercase transition-all"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {p.player?.mobile_number && (
                                <a
                                  href={`https://wa.me/${p.player.mobile_number.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded bg-surface-container-high hover:bg-surface-bright text-emerald-400 transition-colors"
                                  title="Chat via WhatsApp"
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

        {/* REJECT PAYMENT MODAL (Mandatory Rejection Reason) */}
        {isRejecting && activePayment && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-container border border-error/40 rounded-xl p-space-lg max-w-md w-full shadow-2xl flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <span className="font-headline-sm text-headline-sm text-error uppercase font-bold">
                  Reject Payment Slip
                </span>
                <button onClick={() => setIsRejecting(false)} className="text-on-surface-variant hover:text-on-surface">
                  ✕
                </button>
              </div>

              <p className="text-body-sm text-on-surface-variant">
                Rejecting this payment will release Slot #{activePayment.booking?.slot_number} back to AVAILABLE and notify captain {activePayment.booking?.team_name}.
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-label-numeric uppercase text-on-surface">
                  Mandatory Rejection Reason:
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. UTR number not reflected in bank account / invalid amount."
                  rows={3}
                  className="p-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/40 focus:border-error text-body-sm"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-body-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(activePayment.id)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-error hover:bg-error-container text-white font-headline-sm text-body-sm uppercase font-bold"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QUICK BROADCAST ANNOUNCEMENT MODAL */}
        {broadcastOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleBroadcast} className="bg-surface-container border border-outline-variant/40 rounded-xl p-space-lg max-w-lg w-full shadow-2xl flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <span className="font-headline-sm text-headline-sm text-primary uppercase font-bold">
                  Broadcast Room Announcement
                </span>
                <button type="button" onClick={() => setBroadcastOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                  ✕
                </button>
              </div>

              <p className="text-body-sm text-on-surface-variant">
                Transmit a high-priority official marshal message directly to all squads inside {selectedTournament} lobby wire.
              </p>

              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="e.g. Room password will be dispatched in 10 minutes. Ensure all 4 squad players are online."
                rows={4}
                required
                className="p-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/40 focus:border-primary text-body-sm"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBroadcastOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-body-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary font-headline-sm text-body-sm uppercase font-bold"
                >
                  Broadcast to Lobby
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
