import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { api, useAuthStore } from "../store/auth.js";

const formatDayLabel = (isoDate) => {
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

const formatTime = (isoDate) => new Date(isoDate).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

const MatchConversation = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    const loadMatch = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/match/mine");
        const allMatches = data?.data || [];
        const found = allMatches.find((item) => item.id === matchId);
        if (found) {
          setMatch(found);
          setError("");
        } else {
          setMatch(null);
          setError("This match is no longer available. Head back to your matches to explore more connections.");
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Could not load this conversation.");
        setMatch(null);
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      loadMatch();
    }
  }, [matchId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [match?.conversation?.length]);

  const partner = useMemo(() => {
    if (!match?.members?.length) return null;
    if (!currentUserId) return match.members[0];
    return match.members.find((member) => member.id !== currentUserId) || match.members[0];
  }, [match, currentUserId]);

  const messages = match?.conversation || [];

  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDayKey = "";
    messages.forEach((message) => {
      const dayKey = new Date(message.createdAt).toDateString();
      if (dayKey !== currentDayKey) {
        groups.push({ type: "day", id: dayKey, label: formatDayLabel(message.createdAt) });
        currentDayKey = dayKey;
      }
      groups.push({ type: "message", id: message.id, payload: message });
    });
    return groups;
  }, [messages]);

  const isPending = (match?.status || "matched") !== "matched";

  const handleSend = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !matchId) return;
    setSending(true);
    try {
      const { data } = await api.post(`/match/${matchId}/messages`, { text });
      const updated = data?.data?.match;
      if (updated) {
        setMatch(updated);
        setDraft("");
        setError("");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Could not send your message. Try again.");
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    navigate("/matches");
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <button
        type="button"
        onClick={handleBack}
        className="flex w-fit items-center gap-2 rounded-full border border-brand-dark/60 bg-white/60 px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand/20"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to matches
      </button>

      {loading ? (
        <div className="flex h-[70vh] items-center justify-center rounded-[2.5rem] bg-white/80 text-sm font-semibold text-slate-500 shadow-lg">
          Loading conversation...
        </div>
      ) : match ? (
        <div className="flex h-[70vh] flex-col overflow-hidden rounded-[2.5rem] bg-white/80 shadow-xl backdrop-blur">
          <div className="border-b border-white/40 bg-gradient-to-r from-brand-dark to-[#b089ff] px-6 py-5 text-white">
            <div className="flex items-center gap-4">
              <img
                src={partner?.photoUrls?.[0] || `https://api.dicebear.com/7.x/initials/svg?seed=${partner?.firstName || "Kujuana"}`}
                alt={partner?.firstName}
                className="h-14 w-14 rounded-2xl object-cover shadow-lg"
              />
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.35em] text-white/70">Message concierge</span>
                <h1 className="text-2xl font-semibold leading-tight">{partner ? partner.firstName : "Your match"}</h1>
                <span className="text-xs text-white/70">
                  {isPending ? "Awaiting a mutual like" : "You both liked each other - keep the momentum."}
                </span>
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-transparent via-white/60 to-white px-4 py-6">
            {groupedMessages.length ? (
              groupedMessages.map((item) => {
                if (item.type === "day") {
                  return (
                    <div key={item.id} className="flex justify-center">
                      <span className="rounded-full bg-white/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 shadow">
                        {item.label}
                      </span>
                    </div>
                  );
                }
                const message = item.payload;
                const isMine = message.senderId === currentUserId;
                return (
                  <div key={item.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-3xl px-4 py-3 text-sm shadow-md transition ${
                        isMine ? "bg-brand-dark text-white" : "bg-white text-slate-700"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                      <span className={`mt-2 block text-[10px] uppercase tracking-[0.2em] ${isMine ? "text-white/70" : "text-slate-400"}`}>
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="mx-auto max-w-sm rounded-3xl bg-white/90 p-5 text-center text-sm text-slate-500 shadow">
                Break the ice with an intentional note. We&apos;ll keep your history so the story feels continuous.
              </div>
            )}
          </div>

          {error && <p className="px-6 text-sm text-rose-600">{error}</p>}

          <form onSubmit={handleSend} className="border-t border-white/60 bg-white/80 px-4 py-4">
            <div className="flex items-end gap-3 rounded-3xl bg-white/90 px-4 py-3 shadow">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Send a thoughtful message..."
                rows={1}
                className="max-h-32 flex-1 resize-none border-0 bg-transparent text-sm text-slate-700 outline-none focus:ring-0"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="flex items-center gap-2 rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{sending ? "Sending" : "Send"}</span>
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex h-[70vh] flex-col items-center justify-center gap-4 rounded-[2.5rem] bg-white/80 text-center shadow">
          <p className="max-w-sm text-sm text-slate-600">{error || "We couldn\'t find that conversation."}</p>
          <button
            type="button"
            onClick={handleBack}
            className="rounded-full bg-brand-dark px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-dark/90"
          >
            View matches
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchConversation;
