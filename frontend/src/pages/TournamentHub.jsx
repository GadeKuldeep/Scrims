import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import CinematicHero3D from '../components/CinematicHero3D.jsx';

export default function TournamentHub() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [selectedGame, setSelectedGame] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, [selectedGame]);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const params = selectedGame !== 'all' ? { game_id: selectedGame } : {};
      const res = await api.get('/tournaments', { params });

      if (res.data?.success) {
        setTournaments(res.data.tournaments || []);
      }
    } catch (err) {
      console.error('Failed to load tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  const featured = tournaments[0] || null;

  return (
    <div className="w-full pt-20 bg-background flex-1 flex flex-col justify-between">
      {/* Dynamic Ambient Background Glows */}
      <div className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-primary/15 via-amber-500/10 to-transparent rounded-full blur-[140px] -z-10"></div>
        <div className="pointer-events-none absolute top-[40%] -right-40 w-[500px] h-[500px] bg-secondary-container/10 rounded-full blur-[120px] -z-10"></div>
        <div className="pointer-events-none absolute top-[60%] -left-40 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10"></div>

        <section className="w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin py-space-xl lg:py-space-2xl flex flex-col gap-space-2xl">
          
          {/* HERO SECTION: Human-crafted Esports Energy */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
            
            <div className="lg:col-span-6 flex flex-col gap-space-lg">
              
              {/* Live Status Pill */}
              <div className="inline-flex items-center gap-space-xs self-start px-space-sm py-1.5 rounded-full bg-surface-container-high/80 backdrop-blur-md text-primary border border-primary/30 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                <span className="font-label-badge text-label-badge uppercase tracking-widest text-primary font-bold">
                  ⚡ SCRIMS ARENA V2.4 • REAL-TIME TOURNAMENT PROTOCOL
                </span>
              </div>

              {/* Punchy Headline */}
              <div className="flex flex-col gap-space-xs">
                <h1 className="font-display-hero text-display-hero-mobile sm:text-display-hero text-on-surface tracking-tight uppercase leading-[1.05] font-extrabold">
                  DROP IN.
                  <br />
                  <span className="bg-gradient-to-r from-primary via-amber-400 to-amber-500 bg-clip-text text-transparent">
                    COMPETE.
                  </span>
                  <br />
                  CLAIM THE CUP.
                </h1>

                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed mt-2">
                  Official esports tournament platform with verified slot holds, instant WhatsApp room coordination, verified scorekeeping, and certified 4-map leaderboards.
                </p>
              </div>

              {/* Call to Actions */}
              <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
                <a
                  href="#tournaments-grid"
                  className="inline-flex items-center justify-center gap-space-xs px-space-xl py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-container hover:from-primary-container hover:to-secondary-container text-on-primary font-headline-sm text-headline-sm uppercase tracking-wider font-bold transition-all shadow-[0_4px_20px_rgba(234,88,12,0.35)] active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">sports_esports</span>
                  <span>Explore Tournaments</span>
                </a>

                {user?.role === 'SUPER_ADMIN' ? (
                  <Link
                    to="/admin"
                    className="inline-flex items-center justify-center gap-space-xs px-space-lg py-3.5 rounded-xl border border-primary/50 hover:border-primary bg-primary/10 text-primary font-headline-sm text-headline-sm uppercase tracking-wider font-bold transition-all active:scale-95 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    <span>Admin Command Desk</span>
                  </Link>
                ) : (
                  <Link
                    to={featured ? `/room/${featured.id}` : '/register'}
                    className="inline-flex items-center justify-center gap-space-xs px-space-lg py-3.5 rounded-xl border border-outline-variant/50 hover:border-primary/60 bg-surface-container-low text-on-surface-variant hover:text-on-surface font-headline-sm text-headline-sm uppercase tracking-wider transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px] text-amber-400">group_add</span>
                    <span>{featured ? 'Enter Live Room' : 'Register Your Squad'}</span>
                  </Link>
                )}
              </div>

              {/* Human-Crafted Value Props Strip */}
              <div className="grid grid-cols-3 gap-3 pt-space-md border-t border-outline-variant/20 max-w-lg">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                    Fair Play
                  </span>
                  <span className="text-[11px] text-on-surface-variant">Strict anti-cheat</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-amber-400">emoji_events</span>
                    Prize Pool
                  </span>
                  <span className="text-[11px] text-on-surface-variant">₹12,000 Guaranteed</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-emerald-400">timer</span>
                    Schedule
                  </span>
                  <span className="text-[11px] text-on-surface-variant">IST Timezone</span>
                </div>
              </div>

            </div>

            {/* 3D Radiant Gold Trophy Canvas */}
            <div className="lg:col-span-6">
              <CinematicHero3D />
            </div>

          </div>

          {/* TOURNAMENTS SECTION */}
          <div id="tournaments-grid" className="flex flex-col gap-space-lg pt-space-md">

            {/* Section Header & Filters */}
            <div className="flex items-center justify-between flex-wrap gap-space-md border-b border-outline-variant/20 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-primary"></span>
                  <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold uppercase tracking-tight">
                    Tournament Circuits
                  </h2>
                </div>
                <p className="text-body-sm text-on-surface-variant mt-0.5">
                  Live, upcoming, and official brackets managed by Super Admin.
                </p>
              </div>

              {/* Game Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container-low border border-outline-variant/30">
                {[
                  { id: 'all', label: 'All Games' },
                  { id: 'bgmi', label: 'BGMI' },
                  { id: 'freefire', label: 'Free Fire MAX' },
                  { id: 'clashofclans', label: 'Clash of Clans' }
                ].map(game => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      selectedGame === game.id
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {game.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tournament Content Display */}
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="font-mono text-xs uppercase tracking-wider">Syncing Arena Telemetry...</span>
              </div>
            ) : tournaments.length === 0 ? (
              /* HUMAN-CRAFTED PRE-SEASON ARENA LAUNCHPAD */
              <div className="relative rounded-3xl bg-surface-container-lowest border border-outline-variant/30 p-space-xl md:p-space-2xl overflow-hidden shadow-2xl">
                {/* Decorative background gradient */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-primary/15 via-transparent to-transparent rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative max-w-3xl mx-auto flex flex-col items-center text-center gap-space-md">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-primary/20 to-surface-container border border-primary/40 flex items-center justify-center text-primary shadow-xl">
                    <span className="material-symbols-outlined text-5xl text-amber-400">military_tech</span>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/40 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    PRE-SEASON ARENA ACTIVE // READY FOR TOURNAMENT SCHEDULING
                  </div>

                  <h3 className="font-display-hero text-headline-xl md:text-display-sm uppercase font-extrabold tracking-tight text-on-surface">
                    Brackets Opening Soon
                  </h3>

                  <p className="font-body-md text-body-md text-on-surface-variant max-w-xl leading-relaxed">
                    All dummy tournaments and test data have been removed. Every tournament circuit, slot roster, and staff assignment is scheduled and published dynamically by <strong className="text-on-surface">Super Admin Kuldeep Gade</strong>.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                    {user?.role === 'SUPER_ADMIN' ? (
                      <Link
                        to="/admin"
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-container hover:from-primary-container hover:to-secondary-container text-on-primary font-headline-sm text-headline-sm uppercase tracking-wider font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        <span>Schedule First Tournament Now</span>
                      </Link>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm uppercase tracking-wider font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                          <span>Super Admin Login</span>
                        </Link>
                        <Link
                          to="/register"
                          className="px-6 py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface font-headline-sm text-headline-sm uppercase tracking-wider font-bold transition-all active:scale-95 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                          <span>Register Squad / Player</span>
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Operational Protocol Steps */}
                  <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 pt-space-lg mt-space-md border-t border-outline-variant/20 text-left">
                    <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
                      <span className="font-mono text-xs text-primary font-bold">01 // BRACKET CREATION</span>
                      <span className="text-xs font-bold text-on-surface">Super Admin Launches Circuit</span>
                      <span className="text-[11px] text-on-surface-variant">Configures start time, maps, entry fee, and assigns Match Master.</span>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
                      <span className="font-mono text-xs text-amber-400 font-bold">02 // SQUAD SLOT HOLD</span>
                      <span className="text-xs font-bold text-on-surface">Team Leaders Reserve Slot</span>
                      <span className="text-[11px] text-on-surface-variant">10-minute hold with UPI verification via Match Master on WhatsApp.</span>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
                      <span className="font-mono text-xs text-emerald-400 font-bold">03 // 4-MAP CHAMPIONSHIP</span>
                      <span className="text-xs font-bold text-on-surface">Live Drop & Scorekeeping</span>
                      <span className="text-[11px] text-on-surface-variant">Match credentials unlock automatically; Score Master logs kills in real time.</span>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              /* DYNAMIC TOURNAMENT CARDS GRID */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-lg">
                {tournaments.map((t) => {
                  const fillPct = t.stats?.fillPercentage || 0;
                  const booked = t.stats?.bookedSlots || 0;
                  const total = t.max_participants || 16;

                  return (
                    <div
                      key={t.id}
                      className="group relative rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/60 p-5 flex flex-col justify-between gap-4 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                      {/* Top Banner Tag */}
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-md bg-surface-container-high border border-outline-variant/30 text-[10px] font-bold uppercase tracking-wider text-primary">
                          {t.game_id?.toUpperCase() || 'ESPORTS'}
                        </span>
                        <span className="text-[11px] font-mono text-on-surface-variant font-semibold">
                          {t.start_time_ist} IST
                        </span>
                      </div>

                      {/* Tournament Title & Description */}
                      <div className="flex flex-col gap-1.5">
                        <h3 className="font-headline-md text-headline-md font-bold text-on-surface group-hover:text-primary transition-colors">
                          {t.title}
                        </h3>
                        <p className="text-body-sm text-on-surface-variant line-clamp-2">
                          {t.description || 'Official competitive circuit with 4-map cumulative scoring.'}
                        </p>
                      </div>

                      {/* Prize Distribution Breakdown */}
                      <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px]">emoji_events</span>
                            Total Prize Pool
                          </span>
                          <span>₹{t.stats?.prizePool || 12000}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-[10px] text-center font-bold">
                          <span className="p-1 rounded bg-surface-container-high text-on-surface">1st ₹5,000</span>
                          <span className="p-1 rounded bg-surface-container-high text-on-surface">2nd ₹3,000</span>
                          <span className="p-1 rounded bg-surface-container-high text-on-surface">3rd ₹2,000</span>
                        </div>
                      </div>

                      {/* Slot Capacity Progress Bar */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[11px] font-bold text-on-surface-variant uppercase">
                          <span>Roster Capacity</span>
                          <span className="font-mono text-primary">{booked} / {total} Slots</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${fillPct}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-on-surface-variant uppercase font-mono">Entry Fee</span>
                          <span className="text-base font-extrabold text-on-surface">₹{t.entry_fee}</span>
                        </div>

                        <Link
                          to={`/book/${t.id}`}
                          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 shadow-md active:scale-95"
                        >
                          <span>Select Slot</span>
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </section>
      </div>
    </div>
  );
}
