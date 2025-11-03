import { useEffect } from 'react';
import SwipeDeck from '../components/SwipeDeck.jsx';
import { useAuthStore } from '../store/auth.js';

const Discover = () => {
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-400">Discover</p>
        <h1 className="text-3xl font-semibold text-slate-900">Curated matches for intentional love</h1>
        <p className="max-w-md text-sm text-slate-500">
          Swipe with purpose. Every profile is concierge-reviewed so you can focus on chemistry, not chaos.
        </p>
      </div>
      <SwipeDeck />
      <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
        Photo arrows explore pictures | Prev/Next cycle profiles | Heart to like | Message to connect | Star to spotlight
      </p>
    </div>
  );
};

export default Discover;
