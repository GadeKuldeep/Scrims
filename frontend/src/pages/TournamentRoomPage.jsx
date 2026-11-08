import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getSocket } from '../services/socket.js';
import RoleBadge from '../components/RoleBadge.jsx';

export default function TournamentRoomPage() {
  const { id: tournamentId = 'BGMI-2100' } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [activeTab, setActiveTab] = useState('scoreboard'); // 'scoreboard' or 'chat'
  const [activeMap, setActiveMap] = useState('Erangel'); // 'Erangel', 'Livik', 'Rondo', 'Miramar', 'Cumulative'
  
  // Scoreboard Data
  const [mapScores, setMapScores] = useState([]);
  const [aggregateLeaderboard, setAggregateLeaderboard] = useState([]);
  
  // Chat Data
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const chatEndRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTournamentAndRoom();
    loadScores();
    loadChat();

    // Socket Setup
    const socket = getSocket();
    socket.emit('room:join', { tournamentId });

    socket.on('chat:message', (msg) => {
      if (msg.tournament_id === tournamentId) {
        setChatMessages(prev => [...prev, msg]);
        scrollToBottom();
      }
    });

    socket.on('score:updated', (data) => {
      if (data.tournamentId === tournamentId) {
        loadScores();
      }
    });

    socket.on('scoreboard:refresh', () => {
      loadScores();
    });

    return () => {
      socket.emit('room:leave', { tournamentId });
      socket.off('chat:message');
      socket.off('score:updated');
      socket.off('scoreboard:refresh');
    };
  }, [tournamentId, activeMap]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTournamentAndRoom = async () => {
    try {
      const res = await api.get(`/tournaments/${tournamentId}`);
      if (res.data?.success) {
        setTournament(res.data.tournament);
      }

      // Try fetching room credentials if user is authenticated
      if (isAuthenticated) {
        try {
          const credRes = await api.get(`/tournaments/${tournamentId}/room-credentials`);
          if (credRes.data?.success) {
            setCredentials(credRes.data);
          }
        } catch (e) {
          // Room might be locked or user is guest
          setCredentials(null);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadScores = async () => {
    try {
      if (activeMap === 'Cumulative') {
        const res = await api.get(`/scores/${tournamentId}/leaderboard`);
        if (res.data?.success) {
          setAggregateLeaderboard(res.data.leaderboard);
        }
      } else {
        const res = await api.get(`/scores/${tournamentId}/map/${activeMap}`);
        if (res.data?.success) {
          setMapScores(res.data.scores);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadChat = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get(`/chat/${tournamentId}/messages`);
      if (res.data?.success) {
        setChatMessages(res.data.messages);
        setTimeout(scrollToBottom, 200);
      }
    } catch (err) {
      // Not in room
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isAuthenticated) return;

    const socket = getSocket();
    socket.emit('chat:send', {
      tournamentId,
      message: newMessage.trim(),
      message_type: isAnnouncement ? 'ANNOUNCEMENT' : 'CHAT'
    });

    setNewMessage('');
    setIsAnnouncement(false);
  };

  const copyCreds = () => {
    if (credentials?.room_id) {
      navigator.clipboard.writeText(`Room ID: ${credentials.room_id} | Password: ${credentials.room_password}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <span className="font-label-badge text-primary uppercase animate-pulse">CONNECTING TO ARENA POD...</span>
      </div>
    );
  }

  if (!tournament && !loading) {
    return (
      <div className="min-h-[70vh] pt-20 flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-primary mb-2 shadow-lg">
          <span className="material-symbols-outlined text-4xl">stadium</span>
        </div>
        <h2 className="font-headline-lg text-headline-lg uppercase font-bold text-on-surface tracking-wider">No Tournament In This Arena</h2>
        <p className="text-body-sm text-on-surface-variant max-w-md">
          This arena pod does not have an active tournament assigned yet. Super Admin can schedule and publish upcoming tournament circuits from the Command Desk.
        </p>
        <div className="flex gap-3 mt-4">
          <Link to="/tournaments" className="px-5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/40 hover:border-primary text-on-surface text-xs font-bold uppercase tracking-wider transition-all">
            Browse Circuits
          </Link>
          {user?.role === 'SUPER_ADMIN' && (
            <Link to="/admin" className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider shadow-lg hover:bg-primary-container transition-all">
              Command Desk
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!tournament && !loading) {
    return (
      <div className="min-h-[70vh] pt-20 flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-primary mb-2 shadow-lg">
          <span className="material-symbols-outlined text-4xl">stadium</span>
        </div>
        <h2 className="font-headline-lg text-headline-lg uppercase font-bold text-on-surface tracking-wider">No Tournament In This Arena</h2>
        <p className="text-body-sm text-on-surface-variant max-w-md">
          This arena pod does not have an active tournament assigned yet. Super Admin can schedule and publish upcoming tournament circuits from the Command Desk.
        </p>
        <div className="flex gap-3 mt-4">
          <Link to="/tournaments" className="px-5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/40 hover:border-primary text-on-surface text-xs font-bold uppercase tracking-wider transition-all">
            Browse Circuits
          </Link>
          {user?.role === 'SUPER_ADMIN' && (
            <Link to="/admin" className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider shadow-lg hover:bg-primary-container transition-all">
              Command Desk
            </Link>
          )}
        </div>
      </div>
    );
  }

  const isStaff = user && ['SUPER_ADMIN', 'MATCH_MASTER', 'SCORE_MASTER'].includes(user.role);

  return (
    <div className="w-full pt-20 bg-background flex-1 flex flex-col justify-between pb-space-3xl">
      {/* TOURNAMENT BROADCAST HERO HEADER */}
      <section className="relative w-full bg-surface-container-lowest px-margin-mobile md:px-margin py-space-xl border-b border-outline-variant/30 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-primary-container/15 blur-[120px] pointer-events-none rounded-full"></div>

        <div className="relative max-w-[1440px] mx-auto flex flex-col gap-space-lg">
          {/* Top Operational HUD Row */}
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className="inline-flex items-center gap-space-2xs px-space-xs py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-label-badge text-label-badge uppercase border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                {tournament?.is_room_unlocked ? '16/16 Full Capacity Unlocked' : 'Arena Staged (Awaiting Full Capacity)'}
              </span>
              <span className="inline-flex items-center gap-space-2xs px-space-xs py-1 rounded bg-surface-container-high text-on-surface-variant font-label-numeric text-label-numeric">
                <span className="material-symbols-outlined text-[15px] text-primary">lock_open_right</span>
                ROOM PROTOCOL ACTIVE
              </span>
              <span className="inline-flex items-center gap-space-2xs px-space-xs py-1 rounded bg-surface-container-high text-primary font-label-badge text-label-badge">
                <span className="material-symbols-outlined text-[14px]">payments</span>
                GROSS ENTRY COLLECTION: ₹{tournament?.stats?.expectedGrossEntry || 19200}
              </span>
            </div>

            {/* Duty Staff Badges */}
            <div className="flex items-center gap-space-xs font-label-caption text-label-caption flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-on-surface border border-outline-variant/30">
                <span className="material-symbols-outlined text-[14px] text-primary">verified_user</span>
                <span className="text-on-surface-variant">Match Master:</span>
                <strong className="font-label-numeric text-on-surface">{tournament?.matchMaster?.username || 'Vikram_Ops'}</strong>
                <span className="text-primary font-label-badge">{tournament?.matchMaster?.staff_code || '#MM-409'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-on-surface border border-outline-variant/30">
                <span className="material-symbols-outlined text-[14px] text-tertiary">fact_check</span>
                <span className="text-on-surface-variant">Score Master:</span>
                <strong className="font-label-numeric text-on-surface">{tournament?.scoreMaster?.username || 'Rohan_ScoreOps'}</strong>
                <span className="text-tertiary font-label-badge">{tournament?.scoreMaster?.staff_code || '#SM-204'}</span>
              </div>
            </div>
          </div>

          {/* Title & Telemetry Stack */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
            <div className="flex flex-col gap-1 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary-container rounded-full"></span>
                <p className="font-label-numeric text-label-numeric text-primary uppercase tracking-wider font-bold">
                  #{tournament?.id} • 4-Map Tier-1 Scrims
                </p>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight uppercase font-extrabold">
                {tournament?.title}
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Official slot rotation: Erangel → Livik → Rondo → Miramar. All match telemetry verified via Anti-Cheat v4.2.
              </p>
            </div>

            {/* Settled Prize Pool & IST Clock Card */}
            <div className="flex items-center gap-space-sm bg-surface-container-low p-space-sm rounded-lg shadow-md border border-outline-variant/30 shrink-0">
              <div className="flex flex-col pr-space-md">
                <span className="font-label-caption text-label-caption text-on-surface-variant uppercase">
                  Expected Gross Pool
                </span>
                <span className="font-headline-lg text-headline-lg text-primary leading-tight font-bold">
                  ₹{tournament?.stats?.expectedGrossEntry || 19200}
                </span>
                <span className="font-label-caption text-label-caption text-emerald-400 font-semibold">
                  Disbursed upon Score Audit
                </span>
              </div>
              <div className="w-px h-12 bg-outline-variant/30"></div>
              <div className="flex flex-col pl-space-xs">
                <span className="font-label-caption text-label-caption text-on-surface-variant uppercase">
                  Current Session
                </span>
                <div className="flex items-center gap-1 font-headline-md text-headline-md text-primary font-bold">
                  <span className="material-symbols-outlined text-[20px] text-emerald-400 animate-pulse">sports_esports</span>
                  <span>{tournament?.start_time_ist}</span>
                </div>
                <span className="font-label-caption text-label-caption text-emerald-400 font-semibold">
                  Live Match Pod
                </span>
              </div>
            </div>
          </div>

          {/* CREDENTIALS DISPATCH CALLOUT BANNER */}
          {credentials ? (
            <div className="w-full bg-gradient-to-r from-primary-container/20 via-surface-container to-surface-container-high rounded-xl p-space-md shadow-lg border border-primary-container/40 flex flex-col md:flex-row items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-md w-full md:w-auto">
                <div className="w-12 h-12 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-md">
                  <span className="material-symbols-outlined text-[28px]">key</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-label-badge text-label-badge uppercase text-primary tracking-widest font-bold">
                      Tournament Room Unlocked
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-label-caption text-label-caption text-on-surface-variant">
                      Full Capacity Verified by Match Master
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-space-lg gap-y-1 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="font-label-caption text-label-caption text-on-surface-variant uppercase">Room ID:</span>
                      <span className="font-label-numeric text-headline-sm text-on-surface font-bold tracking-widest">
                        {credentials.room_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-label-caption text-label-caption text-on-surface-variant uppercase">Password:</span>
                      <span className="font-label-numeric text-headline-sm text-primary font-bold tracking-wider">
                        {credentials.room_password}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-space-xs w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={copyCreds}
                  className="flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary font-headline-sm text-label-numeric uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer font-bold"
                >
                  <span className="material-symbols-outlined text-[18px]">content_copy</span>
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Room Info'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* ROOM LOCKED NOTICE BANNER */
            <div className="w-full bg-surface-container rounded-xl p-space-md border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-space-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[24px]">lock</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-body-md text-on-surface font-bold uppercase">
                    Custom Room Credentials Protected
                  </span>
                  <span className="text-body-sm text-on-surface-variant">
                    Room ID & Password unlock automatically for confirmed squads once 16/16 capacity is verified.
                  </span>
                </div>
              </div>

              <Link
                to={`/book/${tournamentId}`}
                className="px-4 py-2 rounded-lg bg-primary-container text-on-primary font-headline-sm text-body-sm uppercase font-bold shrink-0 shadow"
              >
                Book / View My Slot
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* MAIN DUAL VIEW: SCOREBOARD & CHAT TABS */}
      <div className="w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin py-space-lg flex flex-col gap-space-md">
        
        {/* Navigation Tabs: Scoreboard vs Chat Wire */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-space-xs">
          <div className="flex items-center gap-space-xs">
            <button
              onClick={() => setActiveTab('scoreboard')}
              className={`flex items-center gap-2 px-space-md py-2 rounded-lg font-headline-sm text-body-md uppercase font-bold transition-all ${
                activeTab === 'scoreboard'
                  ? 'bg-primary-container text-on-primary shadow-md'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">leaderboard</span>
              <span>Live 4-Map Scoreboard</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-space-md py-2 rounded-lg font-headline-sm text-body-md uppercase font-bold transition-all relative ${
                activeTab === 'chat'
                  ? 'bg-primary-container text-on-primary shadow-md'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              <span>Room Lobby Chat Wire</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-on-surface-variant text-body-sm">
            <span className="material-symbols-outlined text-[16px] text-primary">wifi</span>
            <span className="font-label-numeric font-bold text-emerald-400">Socket Active (12ms)</span>
          </div>
        </div>

        {/* TAB PANE 1: LIVE SCOREBOARD */}
        {activeTab === 'scoreboard' && (
          <div className="flex flex-col gap-space-md">
            {/* Map Filter Stepper */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {['Erangel', 'Livik', 'Rondo', 'Miramar', 'Cumulative'].map((map) => (
                <button
                  key={map}
                  onClick={() => setActiveMap(map)}
                  className={`px-4 py-2 rounded-lg font-headline-sm text-body-sm uppercase font-bold transition-all shrink-0 ${
                    activeMap === map
                      ? 'bg-surface-container-high border-2 border-primary text-primary shadow'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/30'
                  }`}
                >
                  {map === 'Cumulative' ? '🏆 Cumulative Standings' : `Map: ${map}`}
                </button>
              ))}
            </div>

            {/* Scoreboard Table */}
            <div className="rounded-xl bg-surface-container border border-outline-variant/30 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                {activeMap === 'Cumulative' ? (
                  /* Cumulative Table */
                  <table className="w-full text-left text-body-sm">
                    <thead className="bg-surface-container-high border-b border-outline-variant/30 font-label-badge text-[11px] uppercase text-on-surface-variant">
                      <tr>
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Squad Name</th>
                        <th className="py-3 px-4 text-center">Matches</th>
                        <th className="py-3 px-4 text-center">Chicken Dinners</th>
                        <th className="py-3 px-4 text-center">Kill Pts</th>
                        <th className="py-3 px-4 text-center">Placement Pts</th>
                        <th className="py-3 px-4 text-right">Total Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {aggregateLeaderboard.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-on-surface-variant">
                            No match results recorded yet.
                          </td>
                        </tr>
                      ) : (
                        aggregateLeaderboard.map((team, idx) => (
                          <tr
                            key={team.slot_number}
                            className={`hover:bg-surface-container-high/60 transition-colors ${
                              idx === 0 ? 'bg-primary-container/10 font-bold' : ''
                            }`}
                          >
                            <td className="py-3 px-4 font-label-numeric font-bold">
                              {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                            </td>
                            <td className="py-3 px-4 font-headline-sm uppercase font-bold text-on-surface flex items-center gap-2">
                              <span>{team.squad_name}</span>
                              <span className="text-[10px] text-outline font-label-numeric">(Slot {team.slot_number})</span>
                            </td>
                            <td className="py-3 px-4 text-center font-label-numeric">{team.matchesPlayed}</td>
                            <td className="py-3 px-4 text-center font-label-numeric text-primary font-bold">{team.chickenDinners}</td>
                            <td className="py-3 px-4 text-center font-label-numeric">{team.killPoints}</td>
                            <td className="py-3 px-4 text-center font-label-numeric">{team.placementPoints}</td>
                            <td className="py-3 px-4 text-right font-headline-sm text-headline-sm text-primary font-extrabold font-label-numeric">
                              {team.totalPoints}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  /* Map Wise Table */
                  <table className="w-full text-left text-body-sm">
                    <thead className="bg-surface-container-high border-b border-outline-variant/30 font-label-badge text-[11px] uppercase text-on-surface-variant">
                      <tr>
                        <th className="py-3 px-4">Placement</th>
                        <th className="py-3 px-4">Slot</th>
                        <th className="py-3 px-4">Squad Name</th>
                        <th className="py-3 px-4 text-center">Kills</th>
                        <th className="py-3 px-4 text-center">Kill Points (1 pt/kill)</th>
                        <th className="py-3 px-4 text-center">Placement Points</th>
                        <th className="py-3 px-4 text-right">Map Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {mapScores.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-on-surface-variant">
                            Scores for Map {activeMap} have not been published yet. Score Master will enter scores live during the drop.
                          </td>
                        </tr>
                      ) : (
                        mapScores.map((s) => (
                          <tr key={s.slot_number} className="hover:bg-surface-container-high/60 transition-colors">
                            <td className="py-3 px-4 font-label-numeric font-bold">
                              {s.placement === 1 ? '🥇 #1' : s.placement === 2 ? '🥈 #2' : s.placement === 3 ? '🥉 #3' : `#${s.placement || '-'}`}
                            </td>
                            <td className="py-3 px-4 font-label-numeric font-semibold">Slot #{s.slot_number}</td>
                            <td className="py-3 px-4 font-headline-sm uppercase font-bold text-on-surface">{s.squad_name}</td>
                            <td className="py-3 px-4 text-center font-label-numeric font-bold">{s.kills}</td>
                            <td className="py-3 px-4 text-center font-label-numeric">{s.kill_points}</td>
                            <td className="py-3 px-4 text-center font-label-numeric">{s.placement_points}</td>
                            <td className="py-3 px-4 text-right font-headline-sm text-headline-sm text-primary font-bold font-label-numeric">
                              {s.total_points}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB PANE 2: REAL-TIME LOBBY CHAT WIRE */}
        {activeTab === 'chat' && (
          <div className="rounded-xl bg-surface-container border border-outline-variant/30 overflow-hidden shadow-2xl flex flex-col h-[580px]">
            {/* Chat Header Banner */}
            <div className="p-space-sm bg-surface-container-high border-b border-outline-variant/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">forum</span>
                <span className="font-headline-sm text-body-sm uppercase font-bold text-on-surface">
                  Tournament Lobby Wire • Room #8849
                </span>
              </div>
              <span className="text-[11px] font-label-caption text-outline">
                Persisted in PostgreSQL • Authorized Room Members Only
              </span>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-space-md overflow-y-auto flex flex-col gap-space-sm bg-surface-container-low/50">
              {chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-on-surface-variant text-body-sm">
                  Lobby wire connected. Send a message to coordinate with squads and Match Masters.
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col p-3 rounded-xl max-w-2xl ${
                      msg.message_type === 'ANNOUNCEMENT'
                        ? 'bg-primary-container/20 border border-primary-container/40 self-center w-full'
                        : msg.user_id === user?.id
                        ? 'bg-surface-container-high border border-outline-variant/40 self-end ml-12'
                        : 'bg-surface-container border border-outline-variant/20 self-start mr-12'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-space-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-body-sm font-bold text-on-surface">
                          {msg.username}
                        </span>
                        <RoleBadge role={msg.user_role} />
                      </div>
                      <span className="font-label-caption text-[10px] text-outline">
                        {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-body-sm text-on-surface leading-relaxed">
                      {msg.message}
                    </p>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message Input Box */}
            {isAuthenticated ? (
              <form onSubmit={handleSendMessage} className="p-space-sm bg-surface-container-high border-t border-outline-variant/30 flex flex-col gap-2">
                {isStaff && (
                  <label className="flex items-center gap-2 text-[11px] font-label-badge uppercase text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnnouncement}
                      onChange={(e) => setIsAnnouncement(e.target.checked)}
                      className="accent-primary-container"
                    />
                    <span>Broadcast as Official Staff Announcement</span>
                  </label>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Transmit telemetry message to room..."
                    className="flex-1 h-11 px-4 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary text-body-sm"
                  />
                  <button
                    type="submit"
                    className="px-5 h-11 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary font-headline-sm text-body-sm uppercase font-bold flex items-center gap-1.5 shadow transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Send</span>
                    <span className="material-symbols-outlined text-[16px]">send</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 bg-surface-container text-center text-body-sm text-on-surface-variant">
                <Link to="/login" className="text-primary hover:underline font-semibold">Sign In</Link> to participate in tournament chat wire.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
