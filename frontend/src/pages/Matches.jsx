import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, useAuthStore } from '../store/auth.js';
import MatchConversationModal from '../components/MatchConversationModal.jsx';

const sortKey = (match) => new Date(match.updatedAt || match.matchedAt || match.createdAt || 0).getTime();

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeMatch, setActiveMatch] = useState(null);
  const [sending, setSending] = useState(false);
  const [conciergeError, setConciergeError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: matchesRes }, { data: statsRes }] = await Promise.all([
          api.get('/match/mine'),
          api.get('/match/stats'),
        ]);
        setMatches(matchesRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!matches.length) return;
    const params = new URLSearchParams(location.search);
    const matchId = params.get('match');
    if (!matchId) return;
    if (activeMatch?.id === matchId) return;
    const found = matches.find((item) => item.id === matchId);
    if (found) {
      setActiveMatch(found);
      setConciergeError('');
    }
  }, [location.search, matches, activeMatch?.id]);

  const showConcierge = Boolean(activeMatch);

  const updateQuery = (nextMatchId, replace = true) => {
    const params = new URLSearchParams(location.search);
    if (nextMatchId) {
      params.set('match', nextMatchId);
    } else {
      params.delete('match');
    }
    const search = params.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace });
  };

  const handleOpenConcierge = (match) => {
    if (!match) return;
    setActiveMatch(match);
    setConciergeError('');
    updateQuery(match.id, false);
  };

  const handleCloseConcierge = () => {
    setActiveMatch(null);
    setConciergeError('');
    updateQuery(null, true);
  };

  const handleSendMessage = async (text) => {
    if (!activeMatch) return false;
    setSending(true);
    try {
      const { data } = await api.post(`/match/${activeMatch.id}/messages`, { text });
      const updatedMatch = data?.data?.match;
      if (updatedMatch) {
        setMatches((prev) => prev.map((item) => (item.id === updatedMatch.id ? updatedMatch : item)));
        setActiveMatch(updatedMatch);
      }
      setConciergeError('');
      return true;
    } catch (error) {
      setConciergeError(error.response?.data?.message || 'Could not send note.');
      return false;
    } finally {
      setSending(false);
    }
  };

  const sortedMatches = useMemo(
    () => matches.slice().sort((a, b) => sortKey(b) - sortKey(a)),
    [matches],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Matches</h1>
          <p className="text-sm text-slate-500">Celebrate meaningful connections and take the next intentional step.</p>
        </div>
        {stats && (
          <div className="flex gap-4">
            <div className="rounded-2xl bg-white px-4 py-3 text-center shadow">
              <p className="text-xs uppercase text-slate-500">Swipes today</p>
              <p className="text-xl font-semibold text-slate-800">{stats.swipesToday}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-center shadow">
              <p className="text-xs uppercase text-slate-500">Matches today</p>
              <p className="text-xl font-semibold text-slate-800">{stats.matchesToday}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sortedMatches.map((match) => {
          const status = match.status || 'matched';
          const isPending = status !== 'matched';
          const counterpart = match.members.find((member) => member.id !== user?.id) || match.members[0];
          const counterpartName = counterpart?.firstName || 'your match';
          const awaitingMemberId = match.awaitingMemberId;
          const awaitingMember = match.members.find((member) => member.id === awaitingMemberId);
          const awaitingName = awaitingMember?.firstName || counterpartName;
          const awaitingIsMe = awaitingMemberId && awaitingMemberId === user?.id;
          const initiatedBy = match.initiatedBy;
          const initiatedByMe = initiatedBy === user?.id;
          const createdOn = match.createdAt ? new Date(match.createdAt).toLocaleDateString() : null;
          const matchedOn = match.matchedAt ? new Date(match.matchedAt).toLocaleDateString() : createdOn;
          const badgeClasses = isPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
          const badgeLabel = isPending ? 'Awaiting reply' : 'Mutual match';
          const summary = isPending
            ? initiatedByMe
              ? `You liked ${counterpartName}${createdOn ? ` on ${createdOn}` : ''}.`
              : `${counterpartName} liked you${createdOn ? ` on ${createdOn}` : ''}.`
            : `Matched on ${matchedOn || '-'}.`;
          const description = isPending
            ? initiatedByMe
              ? awaitingIsMe
                ? 'Waiting for you to respond. A thoughtful message can move the connection forward.'
                : `Waiting for ${awaitingName} to respond. A thoughtful message can move the connection forward.`
              : `${counterpartName} reached out first. Send an intentional reply or update your preferences.`
            : 'Lean into authentic conversation. Share intentions, plan your first meeting, and nurture purpose.';

          return (
            <div key={match.id} className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                  {match.members.slice(0, 2).map((member) => (
                    <img
                      key={member.id}
                      src={member.photoUrls?.[0] || `https://api.dicebear.com/7.x/initials/svg?seed=${member.firstName}`}
                      alt={member.firstName}
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                  ))}
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${badgeClasses}`}>
                  {badgeLabel}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{summary}</p>
                <p className="text-sm text-slate-500">{description}</p>
              </div>
              <button
                type="button"
                className="self-start rounded-full border border-brand-dark px-5 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand/5"
                onClick={() => handleOpenConcierge(match)}
              >
                {isPending ? 'Send a note' : 'Open message concierge'}
              </button>
            </div>
          );
        })}
      </div>
      {!sortedMatches.length && (
        <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-600 shadow">
          <p>No matches yet. Keep showing up intentionally; our community is growing every day.</p>
        </div>
      )}

      {showConcierge && (
        <MatchConversationModal
          match={activeMatch}
          currentUserId={user?.id}
          sending={sending}
          error={conciergeError}
          onClose={handleCloseConcierge}
          onSendMessage={handleSendMessage}
        />
      )}
    </div>
  );
};

export default Matches;
