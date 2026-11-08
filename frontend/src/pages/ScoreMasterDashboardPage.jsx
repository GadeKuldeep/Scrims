import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ScoreMasterDashboardPage() {
  const { user } = useAuth();
  const [tournamentId, setTournamentId] = useState('BGMI-2100');
  const [selectedMap, setSelectedMap] = useState('Erangel');
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [squadName, setSquadName] = useState('TEAM GODLIKE');
  const [kills, setKills] = useState(0);
  const [placement, setPlacement] = useState(1);
  const [reason, setReason] = useState('Official Live Match Scoring');

  const [mapScores, setMapScores] = useState([]);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [tournaments, setTournaments] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const squadNames = [
    'TEAM GODLIKE', 'SOUL ESPORTS', 'HYDRA CLAN', 'S8UL ESPORTS', 
    'REVENANT ESPORTS', 'ORANGUTAN', 'GLOBAL ESPORTS', 'BLIND ESPORTS',
    'GODS REIGN', 'ENTITY GAMING', 'CARNIVAL GAMING', 'TRUE RIPPERS',
    'TEAM FOREVER', 'MEDAL ESPORTS', 'MARCOS GAMING', 'AUTOBOTZ'
  ];

  useEffect(() => {
    loadTournamentList();
  }, []);

  useEffect(() => {
    loadScoresAndHistory();
  }, [tournamentId, selectedMap]);

  useEffect(() => {
    setSquadName(squadNames[selectedSlot - 1] || `Squad #${selectedSlot}`);
    // Check if score exists for selected slot
    const existing = mapScores.find(s => s.slot_number === selectedSlot);
    if (existing) {
      setKills(existing.kills);
      setPlacement(existing.placement || 1);
    } else {
      setKills(0);
      setPlacement(selectedSlot <= 3 ? selectedSlot : 4);
    }
  }, [selectedSlot, mapScores]);

  const loadTournamentList = async () => {
    try {
      const res = await api.get('/tournaments');
      if (res.data?.success) setTournaments(res.data.tournaments);
    } catch (e) {
      console.error(e);
    }
  };

  const loadScoresAndHistory = async () => {
    try {
      const [sRes, hRes] = await Promise.all([
        api.get(`/scores/${tournamentId}/map/${selectedMap}`),
        api.get(`/scores/${tournamentId}/history`)
      ]);
      if (sRes.data?.success) setMapScores(sRes.data.scores);
      if (hRes.data?.success) setScoreHistory(hRes.data.history);
    } catch (e) {
      console.error(e);
    }
  };

  const calcPlacementPoints = (rank) => {
    if (Number(rank) === 1) return 10;
    if (Number(rank) === 2) return 6;
    if (Number(rank) === 3) return 2;
    return 0;
  };

  const currentKillPts = kills * 1;
  const currentPlacePts = calcPlacementPoints(placement);
  const currentTotal = currentKillPts + currentPlacePts;

  const handleSaveScore = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');

    try {
      const res = await api.post(`/scores/${tournamentId}/score`, {
        map_name: selectedMap,
        slot_number: selectedSlot,
        squad_name: squadName,
        kills,
        placement,
        reason
      });

      if (res.data?.success) {
        setFeedback(`Score saved for Slot #${selectedSlot} (${squadName}): ${currentTotal} PTS.`);
        loadScoresAndHistory();
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
        
        {/* Sub-Header / Match Context Banner with Ambient Warm Flare */}
        <div className="relative w-full bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant/30 shadow-xl overflow-hidden">
          <div className="absolute -top-24 right-1/4 w-96 h-48 rounded-full bg-primary-container/15 blur-3xl pointer-events-none"></div>

          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-sm relative z-10">
            {/* Left: Match Identity & Tournament Designation */}
            <div className="flex items-center gap-space-md flex-wrap">
              <div className="flex items-center gap-space-xs">
                <span className="w-1.5 h-6 bg-primary-container rounded-full"></span>
                <div>
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface uppercase font-bold">
                      LIVE SCORING ARBITER WORKSPACE
                    </span>
                    <span className="px-space-xs py-0.5 bg-primary-container text-on-primary font-label-badge text-label-badge uppercase rounded font-bold">
                      #{tournamentId}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-space-xs">
                    Grand Championship Stage • 16 Squads • Custom Point Matrix v4.2
                  </p>
                </div>
              </div>

              <div className="h-8 w-px bg-outline-variant/30 hidden md:block"></div>

              {/* Arbiter Badge */}
              <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-space-xs rounded-lg border border-outline-variant/30">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                <div className="flex flex-col">
                  <span className="font-label-caption text-label-caption text-on-surface-variant uppercase">
                    SCORE MASTER ON DUTY
                  </span>
                  <span className="font-label-numeric text-label-numeric text-on-surface font-bold">
                    {user?.username} <span className="text-primary font-label-caption text-label-caption">({user?.staff_code || '#SM-204'})</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Rule Quick Matrix Mini-Capsule */}
            <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-space-xs rounded-lg text-on-surface-variant border border-outline-variant/30 flex-wrap">
              <span className="material-symbols-outlined text-[16px] text-primary">rule</span>
              <span className="font-label-caption text-label-caption uppercase tracking-wider text-on-surface font-bold">PTS ENGINE:</span>
              <div className="flex items-center gap-1.5 font-label-badge text-label-badge text-on-surface flex-wrap">
                <span className="px-1.5 py-0.5 bg-primary-container/20 text-primary rounded font-bold">1st: 10 PTS</span>
                <span className="px-1.5 py-0.5 bg-surface-container-highest rounded">2nd: 6 PTS</span>
                <span className="px-1.5 py-0.5 bg-surface-container-highest rounded">3rd: 2 PTS</span>
                <span className="px-1.5 py-0.5 bg-surface-container-highest rounded">4th-16th: 0 PTS</span>
                <span className="px-1.5 py-0.5 bg-primary-container text-on-primary rounded font-bold">Kill: 1 PT</span>
              </div>
            </div>
          </div>

          {/* Map Stepper Nav Tabs */}
          <div className="pt-space-md flex items-center gap-space-xs overflow-x-auto border-t border-outline-variant/20 mt-space-sm">
            {['Erangel', 'Livik', 'Rondo', 'Miramar'].map((map) => (
              <button
                key={map}
                type="button"
                onClick={() => setSelectedMap(map)}
                className={`px-4 py-2 rounded-lg font-headline-sm text-body-sm uppercase font-bold transition-all shrink-0 cursor-pointer ${
                  selectedMap === map
                    ? 'bg-primary-container text-on-primary shadow-md'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-outline-variant/30'
                }`}
              >
                MAP: {map}
              </button>
            ))}
          </div>
        </div>

        {feedback && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-body-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{feedback}</span>
            </div>
            <button onClick={() => setFeedback('')} className="text-xs uppercase hover:underline">Dismiss</button>
          </div>
        )}

        {/* PRIMARY OPERATIONS SPLIT CANVAS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
          
          {/* LEFT PANE: Score Master Rapid Entry Console (5 Cols) */}
          <section className="lg:col-span-5 flex flex-col gap-space-md">
            
            {/* 16-Squad Quick Slot Selector Ribbon */}
            <div className="bg-surface-container rounded-xl p-space-md border border-outline-variant/30 shadow-md">
              <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[18px]">sports_esports</span>
                  <h2 className="font-headline-sm text-headline-sm uppercase text-on-surface font-bold">
                    SELECT SQUAD SLOT
                  </h2>
                </div>
                <span className="font-label-caption text-label-caption text-on-surface-variant uppercase tracking-wider font-semibold">
                  SLOT #{selectedSlot} ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-8 gap-1.5 pt-space-xs">
                {Array.from({ length: 16 }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelectedSlot(num)}
                    className={`py-2 rounded text-center font-label-numeric text-label-numeric font-bold transition-all cursor-pointer ${
                      selectedSlot === num
                        ? 'bg-primary-container text-on-primary shadow-md scale-105'
                        : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-outline-variant/30'
                    }`}
                  >
                    {num < 10 ? `0${num}` : num}
                  </button>
                ))}
              </div>
            </div>

            {/* Score Modification Form */}
            <form onSubmit={handleSaveScore} className="bg-surface-container rounded-xl p-space-lg border border-outline-variant/30 shadow-xl flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
                <span className="font-headline-sm text-body-md text-primary font-bold uppercase">
                  Telemetry Scoring: Slot #{selectedSlot}
                </span>
                <span className="font-label-numeric text-headline-sm font-bold text-on-surface">
                  {squadName}
                </span>
              </div>

              {/* Kill Counter (+ / - Controls) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-label-numeric uppercase text-on-surface-variant font-semibold">
                  Finish / Kill Count (1 PT / Kill)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setKills(prev => Math.max(0, prev - 1))}
                    className="w-12 h-12 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 text-on-surface font-display-hero text-headline-md flex items-center justify-center transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={kills}
                    onChange={(e) => setKills(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="flex-1 h-12 text-center bg-surface-container-low text-on-surface font-display-hero text-headline-lg font-bold rounded-lg border border-outline-variant/40 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setKills(prev => prev + 1)}
                    className="w-12 h-12 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 text-on-surface font-display-hero text-headline-md flex items-center justify-center transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Placement Rank Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-label-numeric uppercase text-on-surface-variant font-semibold">
                  Match Placement Finish Rank
                </label>
                <select
                  value={placement}
                  onChange={(e) => setPlacement(parseInt(e.target.value, 10))}
                  className="w-full h-11 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/40 text-body-sm font-bold"
                >
                  <option value={1}>Rank 1 (Chicken Dinner — 10 PTS)</option>
                  <option value={2}>Rank 2 (Runner Up — 6 PTS)</option>
                  <option value={3}>Rank 3 (3rd Place — 2 PTS)</option>
                  {Array.from({ length: 13 }, (_, i) => i + 4).map(r => (
                    <option key={r} value={r}>Rank {r} (0 PTS)</option>
                  ))}
                </select>
              </div>

              {/* Calculated Score Preview Tile */}
              <div className="p-space-md rounded-xl bg-surface-container-low border border-primary/30 flex flex-col gap-2">
                <span className="font-label-badge text-[10px] uppercase text-on-surface-variant tracking-wider">
                  Calculated Points Preview
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[12px] text-on-surface-variant">Kill Points</span>
                    <span className="font-label-numeric text-body-md font-bold text-on-surface">{currentKillPts} PTS</span>
                  </div>
                  <span className="text-on-surface-variant font-bold">+</span>
                  <div className="flex flex-col">
                    <span className="text-[12px] text-on-surface-variant">Placement Points</span>
                    <span className="font-label-numeric text-body-md font-bold text-on-surface">{currentPlacePts} PTS</span>
                  </div>
                  <span className="text-on-surface-variant font-bold">=</span>
                  <div className="flex flex-col text-right">
                    <span className="text-[12px] text-primary uppercase font-bold">Total Map Points</span>
                    <span className="font-display-hero text-headline-lg font-bold text-primary">{currentTotal} PTS</span>
                  </div>
                </div>
              </div>

              {/* Audit Reason */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-label-numeric uppercase text-on-surface-variant font-semibold">
                  Audit Entry Note / Reason
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Map 1 Erangel Live Official Drop Sign-off"
                  required
                  className="h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/40 text-body-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary font-headline-sm text-body-md uppercase font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">save</span>
                    <span>Save & Broadcast Score</span>
                  </>
                )}
              </button>
            </form>
          </section>

          {/* RIGHT PANE: Live Map Scores & Audit Trail (7 Cols) */}
          <section className="lg:col-span-7 flex flex-col gap-space-md">
            
            {/* Live Standings Table for Active Map */}
            <div className="rounded-xl bg-surface-container border border-outline-variant/30 overflow-hidden shadow-xl">
              <div className="p-space-sm bg-surface-container-high border-b border-outline-variant/30 flex items-center justify-between">
                <span className="font-headline-sm text-body-md uppercase font-bold text-on-surface">
                  Map: {selectedMap} Standings ({mapScores.length}/16 Recorded)
                </span>
                <span className="font-label-badge text-primary text-[11px] uppercase font-bold">
                  LIVE SOCKET BROADCAST
                </span>
              </div>

              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-body-sm">
                  <thead className="bg-surface-container-low border-b border-outline-variant/30 font-label-badge text-[10px] uppercase text-on-surface-variant">
                    <tr>
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Slot</th>
                      <th className="py-2.5 px-3">Squad Name</th>
                      <th className="py-2.5 px-3 text-center">Kills</th>
                      <th className="py-2.5 px-3 text-center">Place Pts</th>
                      <th className="py-2.5 px-3 text-right">Total Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {mapScores.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-on-surface-variant">
                          No scores recorded yet for Map: {selectedMap}. Select a slot on the left to enter scores.
                        </td>
                      </tr>
                    ) : (
                      mapScores.map((s) => (
                        <tr
                          key={s.slot_number}
                          onClick={() => setSelectedSlot(s.slot_number)}
                          className={`hover:bg-surface-container-high cursor-pointer transition-colors ${
                            s.slot_number === selectedSlot ? 'bg-primary-container/10' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-label-numeric font-bold">
                            {s.placement === 1 ? '🥇 #1' : s.placement === 2 ? '🥈 #2' : s.placement === 3 ? '🥉 #3' : `#${s.placement}`}
                          </td>
                          <td className="py-2.5 px-3 font-label-numeric font-semibold">Slot #{s.slot_number}</td>
                          <td className="py-2.5 px-3 font-headline-sm uppercase font-bold text-on-surface">{s.squad_name}</td>
                          <td className="py-2.5 px-3 text-center font-label-numeric font-bold">{s.kills}</td>
                          <td className="py-2.5 px-3 text-center font-label-numeric">{s.placement_points}</td>
                          <td className="py-2.5 px-3 text-right font-headline-sm text-primary font-bold font-label-numeric">
                            {s.total_points}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Score Modification Audit History Ledger */}
            <div className="rounded-xl bg-surface-container border border-outline-variant/30 overflow-hidden shadow-xl">
              <div className="p-space-sm bg-surface-container-high border-b border-outline-variant/30 flex items-center justify-between">
                <span className="font-headline-sm text-body-md uppercase font-bold text-on-surface">
                  Audit History Trail (Cryptographic Record)
                </span>
                <span className="font-label-caption text-outline text-[10px] uppercase font-semibold">
                  Permanent Ledger • Non-Erasable
                </span>
              </div>

              <div className="p-space-md max-h-72 overflow-y-auto flex flex-col gap-2 bg-surface-container-low/40">
                {scoreHistory.length === 0 ? (
                  <p className="text-center text-on-surface-variant py-4 text-body-sm">
                    No score modification logs yet.
                  </p>
                ) : (
                  scoreHistory.map((h) => (
                    <div
                      key={h.id}
                      className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/20 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-body-sm font-bold text-on-surface">
                          Slot #{h.slot_number} ({h.squad_name}) • Map: {h.map_name}
                        </span>
                        <span className="text-[10px] font-label-caption text-outline">
                          {new Date(h.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-xs text-primary font-label-numeric font-semibold">
                        {h.change_summary}
                      </span>
                      <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-0.5">
                        <span>Reason: "{h.reason}"</span>
                        <span className="text-outline">By Arbiter: {h.score_master_name}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
