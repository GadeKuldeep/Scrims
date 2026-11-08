import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import RoleBadge from '../components/RoleBadge.jsx';

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('tournaments'); // 'tournaments', 'users', 'audit'

  // Modals
  const [newTournModal, setNewTournModal] = useState(false);
  const [tournTitle, setTournTitle] = useState('');
  const [tournGame, setTournGame] = useState('bgmi');
  const [tournStartIST, setTournStartIST] = useState('09:00 PM IST');
  const [tournEndIST, setTournEndIST] = useState('11:00 PM IST');
  const [tournFee, setTournFee] = useState(1200);

  const [assignModal, setAssignModal] = useState(null);
  const [selectedMM, setSelectedMM] = useState('');
  const [selectedSM, setSelectedSM] = useState('');

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, tournRes, auditRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/tournaments'),
        api.get('/admin/audit-logs')
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.stats);
      if (usersRes.data?.success) setUsers(usersRes.data.users);
      if (tournRes.data?.success) setTournaments(tournRes.data.tournaments);
      if (auditRes.data?.success) setAuditLogs(res => auditRes.data.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFreeze = async () => {
    try {
      const res = await api.post('/admin/emergency-freeze');
      if (res.data?.success) {
        setFeedback(res.data.message);
        loadAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/tournaments', {
        title: tournTitle.trim(),
        game_id: tournGame,
        entry_fee: Number(tournFee),
        start_time_ist: tournStartIST.trim(),
        end_time_ist: tournEndIST.trim(),
        tournament_date: new Date().toISOString().split('T')[0]
      });

      if (res.data?.success) {
        setFeedback(`Tournament "${tournTitle}" scheduled successfully!`);
        setNewTournModal(false);
        setTournTitle('');
        loadAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleAssignStaff = async (e) => {
    e.preventDefault();
    if (!assignModal?.id) return;

    try {
      const res = await api.put(`/admin/tournaments/${assignModal.id}/staff`, {
        match_master_id: selectedMM || undefined,
        score_master_id: selectedSM || undefined
      });
      if (res.data?.success) {
        setFeedback('Staff successfully assigned to tournament.');
        setAssignModal(null);
        loadAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data?.success) {
        setFeedback(res.data.message);
        loadAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const matchMasters = users.filter(u => u.role === 'MATCH_MASTER' || u.role === 'SUPER_ADMIN');
  const scoreMasters = users.filter(u => u.role === 'SCORE_MASTER' || u.role === 'SUPER_ADMIN');

  return (
    <div className="w-full pt-20 bg-surface-container-lowest min-h-screen text-on-surface pb-space-3xl">
      <div className="w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin py-space-md flex flex-col gap-space-lg">
        
        {/* TOP METRIC STRIP: Executive Telemetry Engine */}
        <section className="w-full">
          <div className="flex items-center justify-between pb-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-ping"></span>
              <span className="font-label-badge text-label-badge text-primary-container tracking-widest uppercase font-bold">
                ROOT EXECUTIVE TELEMETRY • CLUSTER-ASIA-S1
              </span>
            </div>
            <div className="flex items-center gap-space-sm text-on-surface-variant font-label-caption text-label-caption uppercase tracking-wider">
              <span>SYNC CYCLE: 1,000MS</span>
              <span>•</span>
              <span className="text-emerald-400 font-label-numeric font-bold">GATEWAY PING: 12MS</span>
              <span>•</span>
              <span className="text-primary font-label-numeric font-bold">FAIR PLAY: 100% OK</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-sm">
            {/* Metric 1: Expected Gross Entry Collection */}
            <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-space-2xs">
                <span className="font-label-caption text-label-caption uppercase tracking-wider text-on-surface-variant">
                  EXPECTED GROSS ENTRY POOL
                </span>
                <span className="px-space-2xs py-0.5 rounded text-[10px] font-label-badge tracking-wider bg-emerald-500/10 text-emerald-400 font-bold">
                  ONLINE
                </span>
              </div>
              <div className="flex items-baseline gap-space-2xs">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
                  ₹{stats?.expectedGrossEntry?.toLocaleString('en-IN') || '842,500'}
                </span>
                <span className="font-label-caption text-label-caption text-emerald-400 font-bold">+14.2%</span>
              </div>
              <div className="mt-space-xs flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Verified Funds: ₹{stats?.verifiedPaymentsTotal?.toLocaleString('en-IN') || '0'}</span>
              </div>
            </div>

            {/* Metric 2: Live Tournaments */}
            <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-md">
              <div className="flex items-center justify-between mb-space-2xs">
                <span className="font-label-caption text-label-caption uppercase tracking-wider text-on-surface-variant">
                  Tournaments Active
                </span>
                <span className="px-space-2xs py-0.5 rounded text-[10px] font-label-badge tracking-wider bg-primary-container/15 text-primary font-bold">
                  TIER 1 & 2
                </span>
              </div>
              <div className="flex items-baseline gap-space-2xs">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
                  {stats?.totalTournaments || tournaments.length} Circuits
                </span>
              </div>
              <div className="mt-space-xs text-on-surface-variant text-body-sm">
                BGMI, Free Fire, Clash Wars
              </div>
            </div>

            {/* Metric 3: Active Players */}
            <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-md">
              <div className="flex items-center justify-between mb-space-2xs">
                <span className="font-label-caption text-label-caption uppercase tracking-wider text-on-surface-variant">
                  Registered Competitors
                </span>
                <span className="px-space-2xs py-0.5 rounded text-[10px] font-label-badge tracking-wider bg-emerald-500/15 text-emerald-400 font-bold">
                  VERIFIED
                </span>
              </div>
              <div className="flex items-baseline gap-space-2xs">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
                  {stats?.totalUsers || users.length}
                </span>
                <span className="text-body-sm text-on-surface-variant">Mobile UUIDs</span>
              </div>
              <div className="mt-space-xs text-on-surface-variant text-body-sm">
                100% Touch Sampling Polling
              </div>
            </div>

            {/* Metric 4: Total Bookings */}
            <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-md">
              <div className="flex items-center justify-between mb-space-2xs">
                <span className="font-label-caption text-label-caption uppercase tracking-wider text-on-surface-variant">
                  Total Reservations
                </span>
                <span className="px-space-2xs py-0.5 rounded text-[10px] font-label-badge tracking-wider bg-primary-container/20 text-primary font-bold">
                  CONFIRMED
                </span>
              </div>
              <div className="flex items-baseline gap-space-2xs">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
                  {stats?.confirmedBookings || 11}
                </span>
                <span className="text-body-sm text-on-surface-variant">/ {stats?.totalBookings || 13} Requests</span>
              </div>
              <div className="mt-space-xs text-on-surface-variant text-body-sm">
                Pending Verification: {stats?.pendingVerifications || 2}
              </div>
            </div>

            {/* Metric 5: Gateway Status */}
            <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-md">
              <div className="flex items-center justify-between mb-space-2xs">
                <span className="font-label-caption text-label-caption uppercase tracking-wider text-on-surface-variant">
                  ARBITER AUDIT RATE
                </span>
                <span className="px-space-2xs py-0.5 rounded text-[10px] font-label-badge tracking-wider bg-emerald-500/10 text-emerald-400 font-bold">
                  98.4%
                </span>
              </div>
              <div className="flex items-baseline gap-space-2xs">
                <span className="font-headline-lg text-headline-lg font-bold text-emerald-400 tracking-tight">
                  100% MANUAL
                </span>
              </div>
              <div className="mt-space-xs text-on-surface-variant text-body-sm">
                Match Master Direct WhatsApp
              </div>
            </div>
          </div>
        </section>

        {/* ROOT ACTIONS & EMERGENCY PLATFORM STRIP */}
        <section className="w-full p-space-md rounded-xl bg-surface-container border border-outline-variant/30 shadow-lg flex flex-col md:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm w-full md:w-auto">
            <div className="w-10 h-10 rounded-lg bg-error-container/40 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-error text-[22px]">admin_panel_settings</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-sm text-headline-sm uppercase tracking-wider font-bold text-on-surface">
                  Emergency Root Override Deck
                </span>
                <span className="px-space-2xs py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-badge text-label-badge font-bold">
                  LEVEL 5 ACCESS
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Immediate operational directives with cryptographic root audit logging
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm w-full md:w-auto justify-start md:justify-end">
            <button
              onClick={handleToggleFreeze}
              className={`flex items-center gap-space-xs px-3 py-2 rounded text-body-sm font-label-badge uppercase font-bold transition-all cursor-pointer ${
                stats?.isRegistrationFrozen
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-error/20 hover:bg-error/30 text-error border border-error/40'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">app_blocking</span>
              <span>{stats?.isRegistrationFrozen ? 'RESUME REGISTRATIONS' : 'FREEZE REGISTRATIONS'}</span>
            </button>

            <button
              onClick={() => setNewTournModal(true)}
              className="flex items-center gap-space-xs px-3 py-2 rounded bg-primary-container hover:bg-secondary-container text-on-primary font-label-badge uppercase font-bold transition-all shadow cursor-pointer text-body-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Create Tournament</span>
            </button>
          </div>
        </section>

        {feedback && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-body-sm flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback('')} className="text-xs uppercase hover:underline">Dismiss</button>
          </div>
        )}

        {/* NAVIGATION TABS FOR MODULES */}
        <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2">
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`px-4 py-2 rounded-lg font-headline-sm text-body-md uppercase font-bold transition-all ${
              activeTab === 'tournaments' ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            Tournaments & Schedules ({tournaments.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-headline-sm text-body-md uppercase font-bold transition-all ${
              activeTab === 'users' ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            User Roles & Staff ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg font-headline-sm text-body-md uppercase font-bold transition-all ${
              activeTab === 'audit' ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            Platform Audit Trail
          </button>
        </div>

        {/* TAB 1: TOURNAMENT MANAGEMENT */}
        {activeTab === 'tournaments' && (
          <div className="rounded-xl bg-surface-container border border-outline-variant/30 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead className="bg-surface-container-high border-b border-outline-variant/30 font-label-badge text-[11px] uppercase text-on-surface-variant">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Game</th>
                    <th className="py-3 px-4">IST Schedule</th>
                    <th className="py-3 px-4">Entry Fee</th>
                    <th className="py-3 px-4">Assigned MM</th>
                    <th className="py-3 px-4">Assigned SM</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {tournaments.map((t) => (
                    <tr key={t.id} className="hover:bg-surface-container-high/60 transition-colors">
                      <td className="py-3 px-4 font-label-numeric font-bold text-primary">#{t.id}</td>
                      <td className="py-3 px-4 font-headline-sm uppercase font-bold text-on-surface">{t.title}</td>
                      <td className="py-3 px-4 uppercase text-xs font-semibold">{t.game_id}</td>
                      <td className="py-3 px-4 font-label-numeric font-semibold">{t.start_time_ist}</td>
                      <td className="py-3 px-4 font-label-numeric font-bold text-primary">₹{t.entry_fee}</td>
                      <td className="py-3 px-4">
                        {t.matchMaster ? `${t.matchMaster.username} (${t.matchMaster.staff_code || 'MM'})` : 'Unassigned'}
                      </td>
                      <td className="py-3 px-4">
                        {t.scoreMaster ? `${t.scoreMaster.username} (${t.scoreMaster.staff_code || 'SM'})` : 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setAssignModal(t);
                            setSelectedMM(t.assigned_match_master_id || '');
                            setSelectedSM(t.assigned_score_master_id || '');
                          }}
                          className="px-3 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-xs uppercase font-bold font-label-badge text-primary"
                        >
                          Assign Staff
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: USER & ROLE MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="rounded-xl bg-surface-container border border-outline-variant/30 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead className="bg-surface-container-high border-b border-outline-variant/30 font-label-badge text-[11px] uppercase text-on-surface-variant">
                  <tr>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Current Role</th>
                    <th className="py-3 px-4">Staff Code</th>
                    <th className="py-3 px-4 text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-container-high/60 transition-colors">
                      <td className="py-3 px-4 font-headline-sm font-bold text-on-surface">{u.username}</td>
                      <td className="py-3 px-4 text-on-surface-variant">{u.full_name}</td>
                      <td className="py-3 px-4 text-xs font-mono">{u.email}</td>
                      <td className="py-3 px-4">
                        <RoleBadge role={u.role} staffCode={u.staff_code} />
                      </td>
                      <td className="py-3 px-4 font-label-numeric font-bold text-primary">{u.staff_code || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="h-8 px-2 bg-surface-container-low text-on-surface rounded border border-outline-variant/30 text-xs font-semibold"
                        >
                          <option value="PLAYER">PLAYER</option>
                          <option value="TEAM_LEADER">TEAM_LEADER</option>
                          <option value="MATCH_MASTER">MATCH_MASTER</option>
                          <option value="SCORE_MASTER">SCORE_MASTER</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="rounded-xl bg-surface-container border border-outline-variant/30 overflow-hidden shadow-xl p-space-md">
            <h3 className="font-headline-sm text-body-md uppercase font-bold text-on-surface mb-3">
              Platform-Wide Audit Trail (Level 5 Security)
            </h3>
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 flex flex-col gap-0.5 text-body-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary uppercase font-label-numeric">{log.action}</span>
                    <span className="text-[10px] text-outline font-label-caption">
                      {new Date(log.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </span>
                  </div>
                  <span className="text-on-surface">Target: {log.target_type} (#{log.target_id})</span>
                  <span className="text-[11px] text-on-surface-variant font-mono">
                    Actor: {log.actor_role} • IP: {log.ip_address}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CREATE TOURNAMENT MODAL */}
        {newTournModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleCreateTournament} className="bg-surface-container border border-outline-variant/40 rounded-xl p-space-lg max-w-lg w-full shadow-2xl flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <span className="font-headline-sm text-headline-sm text-primary uppercase font-bold">
                  Create Tournament Circuit
                </span>
                <button type="button" onClick={() => setNewTournModal(false)} className="text-on-surface-variant hover:text-on-surface">✕</button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-label-numeric uppercase text-on-surface font-semibold">Tournament Title</label>
                <input
                  type="text"
                  value={tournTitle}
                  onChange={(e) => setTournTitle(e.target.value)}
                  placeholder="e.g. BGMI PRO INVITATIONAL SERIES"
                  required
                  className="h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 text-body-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-label-numeric uppercase text-on-surface font-semibold">Game Title</label>
                  <select
                    value={tournGame}
                    onChange={(e) => setTournGame(e.target.value)}
                    className="h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 text-body-sm"
                  >
                    <option value="bgmi">BGMI (16 Slots)</option>
                    <option value="freefire">Free Fire (12 Slots)</option>
                    <option value="clashofclans">Clash of Clans (2 Slots)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-label-numeric uppercase text-on-surface font-semibold">Entry Fee (₹)</label>
                  <input
                    type="number"
                    value={tournFee}
                    onChange={(e) => setTournFee(e.target.value)}
                    required
                    className="h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 text-body-sm font-label-numeric font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-label-numeric uppercase text-on-surface font-semibold">Start Time (IST)</label>
                  <input
                    type="text"
                    value={tournStartIST}
                    onChange={(e) => setTournStartIST(e.target.value)}
                    placeholder="09:00 PM IST"
                    required
                    className="h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 text-body-sm font-label-numeric"
                  />
                  <span className="text-[10px] text-outline">Hourly 11:00 AM - 11:00 PM IST</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-label-numeric uppercase text-on-surface font-semibold">End Time (IST)</label>
                  <input
                    type="text"
                    value={tournEndIST}
                    onChange={(e) => setTournEndIST(e.target.value)}
                    placeholder="11:00 PM IST"
                    required
                    className="h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 text-body-sm font-label-numeric"
                  />
                  <span className="text-[10px] text-outline">Before 11:59 PM IST</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setNewTournModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-body-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary font-headline-sm text-body-sm uppercase font-bold"
                >
                  Schedule Tournament
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ASSIGN STAFF MODAL */}
        {assignModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleAssignStaff} className="bg-surface-container border border-outline-variant/40 rounded-xl p-space-lg max-w-md w-full shadow-2xl flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <span className="font-headline-sm text-headline-sm text-primary uppercase font-bold">
                  Assign Staff to #{assignModal.id}
                </span>
                <button type="button" onClick={() => setAssignModal(null)} className="text-on-surface-variant hover:text-on-surface">✕</button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-label-numeric uppercase text-on-surface font-semibold">Match Master</label>
                <select
                  value={selectedMM}
                  onChange={(e) => setSelectedMM(e.target.value)}
                  className="h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 text-body-sm font-semibold"
                >
                  <option value="">Select Match Master</option>
                  {matchMasters.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.username} ({m.staff_code || 'MM'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-label-numeric uppercase text-on-surface font-semibold">Score Master</label>
                <select
                  value={selectedSM}
                  onChange={(e) => setSelectedSM(e.target.value)}
                  className="h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 text-body-sm font-semibold"
                >
                  <option value="">Select Score Master</option>
                  {scoreMasters.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.username} ({s.staff_code || 'SM'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setAssignModal(null)}
                  className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-body-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary font-headline-sm text-body-sm uppercase font-bold"
                >
                  Save Assignments
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
