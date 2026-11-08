import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function TeamLeaderPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  // Create Team Form State
  const [createTeamName, setCreateTeamName] = useState('');
  const [createTeamTag, setCreateTeamTag] = useState('');
  const [createTeamBio, setCreateTeamBio] = useState('');

  // Invite Member State
  const [inviteInput, setInviteInput] = useState('');
  const [inviting, setInviting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teams/my');
      if (res.data?.success) {
        setTeam(res.data.team);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/teams', {
        name: createTeamName.trim(),
        tag: createTeamTag.trim(),
        bio: createTeamBio.trim(),
        in_game_id: user?.in_game_id
      });
      if (res.data?.success) {
        setFeedback(`Team "${res.data.team.name}" created successfully!`);
        loadTeam();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteInput.trim() || !team?.id) return;

    setInviting(true);
    setError('');
    setFeedback('');

    try {
      const res = await api.post(`/teams/${team.id}/invite`, {
        username_or_email: inviteInput.trim()
      });
      if (res.data?.success) {
        setFeedback(`Invitation dispatched to ${inviteInput}.`);
        setInviteInput('');
        loadTeam();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!window.confirm('Are you sure you want to remove this member from the roster?')) return;
    try {
      const res = await api.delete(`/teams/${team.id}/members/${memberUserId}`);
      if (res.data?.success) {
        setFeedback('Member removed from team roster.');
        loadTeam();
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <span className="font-label-badge text-primary uppercase animate-pulse">LOADING SQUAD ROSTER...</span>
      </div>
    );
  }

  return (
    <div className="w-full pt-20 bg-background flex-1 flex flex-col justify-between pb-space-3xl">
      <div className="w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin py-space-md flex flex-col gap-space-lg">
        
        {feedback && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-body-sm flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback('')} className="text-xs uppercase hover:underline">Dismiss</button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-error-container/30 border border-error/50 text-error text-body-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-xs uppercase hover:underline">Dismiss</button>
          </div>
        )}

        {!team ? (
          /* CREATE TEAM FORM */
          <div className="max-w-xl mx-auto w-full bg-surface-container rounded-xl p-space-xl border border-outline-variant/30 shadow-2xl flex flex-col gap-space-md my-space-xl">
            <div className="flex flex-col gap-1 pb-space-xs border-b border-outline-variant/20">
              <span className="font-label-badge text-primary uppercase font-bold">ROSTER ENROLLMENT</span>
              <h1 className="font-headline-lg text-headline-lg uppercase font-bold text-on-surface">
                Create Competitive Squad
              </h1>
              <p className="text-body-sm text-on-surface-variant">
                Establish an official team roster to book slots in Tier-1/Tier-2 BGMI and Free Fire scrims.
              </p>
            </div>

            <form onSubmit={handleCreateTeam} className="flex flex-col gap-space-md">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-label-numeric uppercase text-on-surface font-semibold">Team Full Name</label>
                <input
                  type="text"
                  value={createTeamName}
                  onChange={(e) => setCreateTeamName(e.target.value)}
                  placeholder="e.g. TEAM GODLIKE"
                  required
                  className="h-11 px-3.5 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary text-body-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-label-numeric uppercase text-on-surface font-semibold">Team Tag (3-4 Characters)</label>
                <input
                  type="text"
                  value={createTeamTag}
                  onChange={(e) => setCreateTeamTag(e.target.value)}
                  placeholder="e.g. GDL"
                  maxLength={5}
                  required
                  className="h-11 px-3.5 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary text-body-sm uppercase font-label-numeric"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-label-numeric uppercase text-on-surface font-semibold">Team Bio / Description</label>
                <textarea
                  value={createTeamBio}
                  onChange={(e) => setCreateTeamBio(e.target.value)}
                  placeholder="e.g. Competitive Tier-1 squad focusing on aggressive fragging and Livik rotation."
                  rows={3}
                  className="p-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary text-body-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary font-headline-sm text-body-md uppercase font-bold shadow-lg transition-all active:scale-[0.99] cursor-pointer"
              >
                Create Squad & Claim IGL Role
              </button>
            </form>
          </div>
        ) : (
          /* ACTIVE SQUAD COMMAND DESK */
          <div className="flex flex-col gap-space-lg">
            
            {/* Squad Hero Banner */}
            <section className="w-full bg-surface-container-low rounded-xl p-space-lg border border-outline-variant/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-md">
                <img
                  src={team.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150'}
                  alt={team.name}
                  className="w-16 h-16 rounded-xl object-cover ring-2 ring-primary/40 shadow-md"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h1 className="font-headline-lg text-headline-lg uppercase font-bold text-on-surface">
                      {team.name}
                    </h1>
                    <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary font-label-badge text-label-badge font-bold">
                      [{team.tag}]
                    </span>
                  </div>
                  <span className="text-body-sm text-on-surface-variant max-w-xl">
                    {team.bio || 'Official SCRIMS Registered Squad.'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-surface-container font-label-numeric text-body-sm text-emerald-400 font-bold border border-emerald-500/30">
                  {team.members?.length || 1} / 4 PLAYERS SIGNED
                </span>
              </div>
            </section>

            {/* Split Grid: Roster List (7 cols) / Invite Form (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
              
              {/* Roster Table (7 cols) */}
              <section className="lg:col-span-7 flex flex-col gap-space-md">
                <div className="rounded-xl bg-surface-container border border-outline-variant/30 overflow-hidden shadow-xl">
                  <div className="p-space-sm bg-surface-container-high border-b border-outline-variant/30 flex items-center justify-between">
                    <span className="font-headline-sm text-body-md uppercase font-bold text-on-surface">
                      Active Squad Roster ({team.members?.length || 1})
                    </span>
                    <span className="font-label-caption text-primary uppercase font-bold">
                      Fair Play Roster Lock Active
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-body-sm">
                      <thead className="bg-surface-container-low border-b border-outline-variant/20 font-label-badge text-[11px] uppercase text-on-surface-variant">
                        <tr>
                          <th className="py-3 px-4">Player</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">In-Game UID</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {team.members?.map((m) => (
                          <tr key={m.id} className="hover:bg-surface-container-high/60 transition-colors">
                            <td className="py-3 px-4 flex items-center gap-2 font-headline-sm uppercase font-bold text-on-surface">
                              <img
                                src={m.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover"
                              />
                              <span>{m.username}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-badge text-[10px] uppercase font-bold text-primary">
                                {m.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-label-numeric font-mono text-xs">
                              {m.in_game_id || 'Pending Link'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {m.role !== 'LEADER' && user?.id === team.leader_id && (
                                <button
                                  onClick={() => handleRemoveMember(m.user_id)}
                                  className="text-xs text-error hover:underline uppercase font-bold"
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Invite Member Form (5 cols) */}
              <section className="lg:col-span-5 flex flex-col gap-space-md">
                <form onSubmit={handleInviteMember} className="rounded-xl bg-surface-container border border-outline-variant/30 p-space-lg shadow-xl flex flex-col gap-space-md">
                  <div className="flex flex-col gap-1 pb-space-xs border-b border-outline-variant/20">
                    <span className="font-headline-sm text-body-md uppercase font-bold text-primary">
                      Invite Squad Competitor
                    </span>
                    <p className="text-body-sm text-on-surface-variant">
                      Enter the registered username or email of a player to dispatch a roster invitation.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-label-numeric uppercase text-on-surface font-semibold">
                      Username or Email
                    </label>
                    <input
                      type="text"
                      value={inviteInput}
                      onChange={(e) => setInviteInput(e.target.value)}
                      placeholder="e.g. Shadow_Sniper or player@scrims.gg"
                      required
                      className="h-11 px-3.5 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary text-body-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={inviting}
                    className="w-full h-11 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary font-headline-sm text-body-sm uppercase font-bold shadow transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {inviting ? 'Dispatching...' : 'Send Roster Invitation'}
                  </button>
                </form>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
