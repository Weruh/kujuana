import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  VideoCameraIcon,
  MicrophoneIcon,
} from "@heroicons/react/24/solid";
import { EllipsisVerticalIcon, FaceSmileIcon, PaperClipIcon, CameraIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/20/solid";
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

const chatBackgroundStyle = {
  backgroundColor: "#efeae2",
  backgroundImage:
    "url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27320%27 height=%27320%27 fill=%27none%27 viewBox=%270 0 160 160%27%3E%3Cg opacity=%270.22%27%3E%3Cpath fill=%23f7f2eb d=%27M0 0h160v160H0z%27/%3E%3Cpath stroke=%23d5c7b5 stroke-width=%271.6%27 d=%27M15 15h40v40H15zM105 15h40v40h-40zM60 105h40v40H60z%27/%3E%3Cpath stroke=%23d5c7b5 stroke-linecap=%27round%27 stroke-width=%271.6%27 d=%27M60 15l20 20 20-20M15 95l20 20-20 20M125 95l20 20-20 20%27/%3E%3C/g%3E%3C/svg%3E')",
  backgroundSize: "360px",
};

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
  const textareaRef = useRef(null);
  const attachmentInputRef = useRef(null);

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

  useEffect(() => {
    if (!textareaRef.current) return;
    const element = textareaRef.current;
    element.style.height = "auto";
    const nextHeight = Math.min(element.scrollHeight, 160);
    element.style.height = `${nextHeight}px`;
  }, [draft]);

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
  const statusText = isPending ? "waiting for a response" : "online";

  const submitMessage = async () => {
    const text = draft.trim();
    if (!text || !matchId || sending) return;
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

  const handleSend = async (event) => {
    event.preventDefault();
    await submitMessage();
  };

  const handleComposerKeyDown = async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await submitMessage();
    }
  };

  const handleInsertEmoji = () => {
    setDraft((prev) => `${prev}${prev ? " " : ""}:)`);
  };

  const handleAttachmentClick = () => {
    attachmentInputRef.current?.click();
  };

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const names = files.map((file) => file.name).join(", ");
    setDraft((prev) => `${prev}${prev ? "\n" : ""}[Attachment: ${names}]`);
    event.target.value = "";
    textareaRef.current?.focus();
  };

  const handleBack = () => {
    navigate("/matches");
  };

  const hasDraft = draft.trim().length > 0;

  if (loading) {
    return (
      <div className="flex h-[78vh] items-center justify-center rounded-[2rem] border border-[#d1d7db] bg-white/90 text-sm font-semibold text-slate-500 shadow-lg">
        Loading conversation...
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex h-[78vh] flex-col items-center justify-center gap-4 rounded-[2rem] border border-[#d1d7db] bg-white/90 text-center shadow">
        <p className="max-w-sm text-sm text-slate-600">{error || "We couldn't find that conversation."}</p>
        <button
          type="button"
          onClick={handleBack}
          className="rounded-full bg-brand-dark px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-dark/90"
        >
          View matches
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[78vh] flex-col overflow-hidden rounded-[2rem] border border-[#d1d7db] bg-[#f0f2f5] shadow-xl">
      <div className="flex items-center justify-between bg-[#075E54] px-6 py-5 text-white shadow">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Back to matches"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <img
            src={partner?.photoUrls?.[0] || `https://api.dicebear.com/7.x/initials/svg?seed=${partner?.firstName || "Kujuana"}`}
            alt={partner?.firstName}
            className="h-12 w-12 rounded-full border-2 border-white/30 object-cover shadow"
          />
          <div className="leading-tight">
            <h1 className="text-lg font-semibold">{partner ? partner.firstName : "Your match"}</h1>
            <div className="flex items-center gap-2 text-xs text-white/80">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#25D366]" aria-hidden="true" />
              <span className="capitalize">{statusText}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5 text-white/80">
          <VideoCameraIcon className="h-5 w-5" />
          <PhoneIcon className="h-5 w-5" />
          <EllipsisVerticalIcon className="h-5 w-5" />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6" style={chatBackgroundStyle}>
        <div className="space-y-4">
          {groupedMessages.length ? (
            groupedMessages.map((item) => {
              if (item.type === "day") {
                return (
                  <div key={item.id} className="flex justify-center">
                    <span className="rounded-full bg-[#e4e1db]/90 px-3 py-1 text-xs font-medium text-[#596568] shadow-sm">
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
                    className={`relative max-w-[82%] rounded-2xl border px-3 py-2 text-[15px] leading-snug shadow-sm ${
                      isMine
                        ? "rounded-br-md border-[#b7ddb0] bg-[#dcf8c6] text-[#1f2c34]"
                        : "rounded-bl-md border-[#dfe1dc] bg-white text-[#1f2c34]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-[#6a7175]">
                      <span>{formatTime(message.createdAt)}</span>
                      {isMine && (
                        <span className="flex items-center text-[#34b7f1]" aria-label="Delivered">
                          <CheckIcon className="h-3 w-3" />
                          <CheckIcon className="h-3 w-3 -ml-2" />
                        </span>
                      )}
                    </div>
                    <span
                      className={`absolute bottom-0 ${isMine ? "right-[-6px]" : "left-[-6px]"} h-3 w-3 rotate-45 ${
                        isMine
                          ? "border-b border-r border-[#b7ddb0] bg-[#dcf8c6]"
                          : "border-b border-l border-[#dfe1dc] bg-white"
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="mx-auto max-w-sm rounded-2xl border border-[#d1d7db] bg-white/95 p-5 text-center text-sm text-[#5d656a] shadow">
              Break the ice with a thoughtful note. Your conversation history stays here.
            </div>
          )}
        </div>
      </div>

      {error && <p className="px-6 pb-1 text-sm text-rose-600">{error}</p>}

      <form onSubmit={handleSend} className="border-t border-[#d1d7db] bg-[#f0f2f5] px-5 py-4">
        <div className="flex items-end gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
          <button
            type="button"
            onClick={handleInsertEmoji}
            className="flex h-10 w-10 items-center justify-center text-[#54656f] transition hover:text-[#075E54]"
            aria-label="Add emoji"
          >
            <FaceSmileIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={handleAttachmentClick}
            className="flex h-10 w-10 items-center justify-center text-[#54656f] transition hover:text-[#075E54]"
            aria-label="Add attachment"
          >
            <PaperClipIcon className="h-6 w-6 rotate-45" />
          </button>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder="Type a message"
            rows={1}
            className="max-h-40 flex-1 resize-none border-0 bg-transparent text-[15px] text-[#1f2c34] outline-none focus:ring-0"
          />
          <button
            type="button"
            onClick={handleAttachmentClick}
            className="flex h-10 w-10 items-center justify-center text-[#54656f] transition hover:text-[#075E54]"
            aria-label="Open camera"
          >
            <CameraIcon className="h-6 w-6" />
          </button>
          <input
            ref={attachmentInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleAttachmentChange}
          />
          {hasDraft ? (
            <button
              type="submit"
              disabled={sending}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#008069] text-white transition hover:bg-[#006f5c] disabled:opacity-60"
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDraft("Sending a quick voice note...")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00A884] text-white transition hover:bg-[#02926f]"
              aria-label="Record voice message"
            >
              <MicrophoneIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default MatchConversation;

