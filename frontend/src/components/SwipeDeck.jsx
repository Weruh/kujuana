import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { api } from '../store/auth.js';
import demoProfiles from '../data/mockProfiles.js';
import SwipeCard from './SwipeCard.jsx';

const buildMockDeck = () =>
  demoProfiles.map((profile) => ({
    ...profile,
    interests: [...(profile.interests || [])],
    photoUrls: [...(profile.photoUrls || [])],
    location: profile.location ? { ...profile.location } : null,
  }));

const SwipeDeck = () => {
  const mockDeck = useMemo(() => buildMockDeck(), []);
  const [suggestions, setSuggestions] = useState(mockDeck);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [matchDialog, setMatchDialog] = useState(null);
  const [latestMatchId, setLatestMatchId] = useState(null);
  const navigate = useNavigate();

  const hydrateSuggestions = useCallback((list) => {
    const next = Array.isArray(list) && list.length ? list : buildMockDeck();
    setSuggestions(next);
    setCurrentIndex(0);
  }, []);

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/match/suggestions');
      hydrateSuggestions(data?.data || []);
    } catch (error) {
      console.error(error);
      hydrateSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [hydrateSuggestions]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleDecision = async (decision, { advance = true } = {}) => {
    if (!suggestions.length) return;
    const current = suggestions[currentIndex];

    if (current?.id) {
      try {
        const { data } = await api.post('/match/swipe', {
          targetId: current.id,
          decision,
        });
        const matchData = data?.data?.match;
        if (matchData) {
          setMatchDialog({
            match: matchData,
            partner: current,
          });
          setLatestMatchId(matchData.id);
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (!advance) return;

    const updatedSuggestions = suggestions.filter((_, index) => index !== currentIndex);
    if (!updatedSuggestions.length) {
      setSuggestions(buildMockDeck());
      setCurrentIndex(0);
      return;
    }

    const nextIndex = currentIndex >= updatedSuggestions.length ? 0 : currentIndex;
    setSuggestions(updatedSuggestions);
    setCurrentIndex(nextIndex);
  };

  const closeMatchDialog = () => setMatchDialog(null);

  const openConcierge = () => {
    if (matchDialog?.match?.id) {
      navigate(`/matches/${matchDialog.match.id}`);
    }
    setMatchDialog(null);
  };

  const handlePrevProfile = () => {
    const total = suggestions.length;
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNextProfile = () => {
    const total = suggestions.length;
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  if (loading && !suggestions.length) {
    return (
      <div className="flex h-96 items-center justify-center rounded-[38px] bg-white shadow-lg">
        <p className="text-sm font-semibold text-slate-500">Curating intentional matches...</p>
      </div>
    );
  }

  if (!suggestions.length) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-[38px] bg-white p-10 text-center shadow-lg">
        <h2 className="text-xl font-semibold text-slate-800">You are all caught up</h2>
        <p className="text-sm text-slate-500">
          Our team is sourcing more intentional singles. Check back soon or expand your preferences.
        </p>
      </div>
    );
  }

  const totalSuggestions = suggestions.length;
  const safeIndex = Math.min(currentIndex, totalSuggestions - 1);
  const current = suggestions[safeIndex];
  const partner = matchDialog?.partner;
  const partnerName = partner?.firstName || 'your match';
  const matchStatus = matchDialog?.match?.status || 'matched';
  const isMutual = matchStatus === 'matched';

  const badgeStyles = isMutual ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
  const badgeText = isMutual ? 'Mutual match' : 'Awaiting reply';
  const dialogTitle = isMutual ? "It's a match!" : 'Thoughtful hello sent';
  const dialogMessage = isMutual
    ? `You and ${partnerName} both liked each other. Start the conversation while the energy is fresh.`
    : `You liked ${partnerName}. Share a heartfelt opener. They'll see it even before they tap like.`;

  const handleMessage = () => {
    if (matchDialog?.match?.id) {
      openConcierge();
      return;
    }
    const targetMatchId = latestMatchId || current?.existingMatchId || current?.matchId;
    if (targetMatchId) {
      navigate(`/matches/${targetMatchId}`);
    } else {
      navigate('/matches');
    }
  };

  return (
    <>
      {matchDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
            <button
              type="button"
              onClick={closeMatchDialog}
              className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600"
              aria-label="Close match dialog"
            >
              &times;
            </button>
            <div className="mb-3 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] text-brand-dark">
              <span>Connection update</span>
              <span className={`rounded-full px-2 py-0.5 tracking-normal ${badgeStyles}`}>{badgeText}</span>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">{dialogTitle}</h2>
            <p className="mt-3 text-sm text-slate-600">{dialogMessage}</p>
            <div className="mt-6 flex items-center justify-center">
              <img
                src={partner?.photoUrls?.[0] || `https://api.dicebear.com/7.x/initials/svg?seed=${partnerName}`}
                alt={partnerName}
                className="h-24 w-24 rounded-3xl object-cover shadow-lg"
              />
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={openConcierge}
                className="rounded-full bg-brand-dark px-6 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-brand-dark/90"
              >
                Message in concierge
              </button>
              <button
                type="button"
                onClick={closeMatchDialog}
                className="rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand-dark hover:text-brand-dark"
              >
                Keep exploring
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-5">
        <SwipeCard
          profile={current}
          onLike={() => handleDecision('like', { advance: false })}
          onPass={() => handleDecision('pass')}
          onSuperLike={() => handleDecision('superlike')}
          onMessage={handleMessage}
          onPrevProfile={handlePrevProfile}
          onNextProfile={handleNextProfile}
        />

        <div className="flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          <button
            type="button"
            onClick={handlePrevProfile}
            disabled={totalSuggestions <= 1}
            className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-[11px] font-semibold tracking-[0.2em] text-slate-500 transition hover:border-brand-dark hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Show previous profile"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Prev
          </button>
          <span className="text-[11px] tracking-[0.2em] text-slate-500">
            {safeIndex + 1} of {totalSuggestions}
          </span>
          <button
            type="button"
            onClick={handleNextProfile}
            disabled={totalSuggestions <= 1}
            className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-[11px] font-semibold tracking-[0.2em] text-slate-500 transition hover:border-brand-dark hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Show next profile"
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
};

export default SwipeDeck;















