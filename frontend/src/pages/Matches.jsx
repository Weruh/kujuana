import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckIcon } from "@heroicons/react/24/solid";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { api, useAuthStore } from "../store/auth.js";

const sortKey = (match) => new Date(match.updatedAt || match.matchedAt || match.createdAt || 0).getTime();

const sameCalendarDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatRelativeDay = (isoDate) => {
  if (!isoDate) return "--";
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (sameCalendarDay(date, today)) return "Today";
  if (sameCalendarDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long" });
};

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: matchesRes }, { data: statsRes }] = await Promise.all([
          api.get("/match/mine"),
          api.get("/match/stats"),
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
    const matchId = params.get("match");
    if (!matchId) return;
    const exists = matches.some((item) => item.id === matchId);
    if (exists) {
      navigate(`/matches/${matchId}`, { replace: true });
    }
  }, [location.search, matches, navigate]);

  const handleOpenConcierge = (match) => {
    if (!match?.id) return;
    navigate(`/matches/${match.id}`);
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

      <div className="space-y-3">
        {sortedMatches.map((match, index) => {
          const status = match.status || "matched";
          const isPending = status !== "matched";
          const members = match.members || [];
          const counterpart = members.find((member) => member.id !== user?.id) || members[0];
          const counterpartName = counterpart
            ? counterpart.firstName || counterpart.lastName || "Your match"
            : "Your match";
          const avatarUrl = counterpart?.photoUrls?.[0] || null;
          const avatarInitial = (counterpart?.firstName?.[0] || counterpart?.lastName?.[0] || counterpartName?.[0] || "Y").toUpperCase();
          const conversation = match.conversation || [];
          const lastMessage = conversation.length ? conversation[conversation.length - 1] : null;
          const awaitingMember = members.find((member) => member.id === match.awaitingMemberId);
          const lastMessageText = lastMessage?.text?.trim();
          const lastMessagePreview = lastMessageText
            ? lastMessageText
            : isPending
            ? match.initiatedBy === user?.id
              ? `Waiting for ${awaitingMember?.firstName || counterpartName} to respond`
              : `${counterpartName} liked you. Say hi!`
            : "Start a thoughtful conversation.";
          const lastActivity = lastMessage?.createdAt || match.updatedAt || match.matchedAt || match.createdAt;
          const dayLabel = formatRelativeDay(lastActivity);
          const rowClasses = `flex w-full items-center gap-4 rounded-3xl border border-transparent px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${index === 0 ? "bg-slate-50" : "bg-white"}`;
          const ringClasses = `flex h-12 w-12 flex-none items-center justify-center rounded-full border-2 p-[2px] ${isPending ? "border-amber-400" : "border-emerald-500"}`;
          const checkClasses = `h-4 w-4 flex-none ${isPending ? "text-amber-500" : "text-emerald-500"}`;

          return (
            <button key={match.id} type="button" onClick={() => handleOpenConcierge(match)} className={rowClasses}>
              <span className={ringClasses}>
                <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-semibold uppercase text-slate-600">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={`${counterpartName} avatar`} className="h-full w-full object-cover" />
                  ) : (
                    avatarInitial
                  )}
                </span>
              </span>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{counterpartName}</p>
                  <span className="text-xs text-slate-400">{dayLabel}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckIcon className={checkClasses} />
                  <span className="flex-1 truncate">{lastMessagePreview}</span>
                </div>
              </div>
              <ChevronDownIcon className="h-4 w-4 flex-none text-slate-400" />
            </button>
          );
        })}
      </div>
      {!sortedMatches.length && (
        <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-600 shadow">
          <p>No matches yet. Keep showing up intentionally; our community is growing every day.</p>
        </div>
      )}
    </div>
  );
};

export default Matches;













