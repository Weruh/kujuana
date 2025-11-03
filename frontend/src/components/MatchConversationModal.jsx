import { useEffect, useMemo, useRef, useState } from 'react';

const MatchConversationModal = ({ match, currentUserId, sending, error, onClose, onSendMessage }) => {
  const [draft, setDraft] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    setDraft('');
  }, [match?.id]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [match?.conversation?.length]);

  const partner = useMemo(() => {
    if (!match?.members?.length) return null;
    if (!currentUserId) return match.members[0];
    return match.members.find((member) => member.id !== currentUserId) || match.members[0];
  }, [match, currentUserId]);

  if (!match) return null;

  const isPending = (match.status || 'matched') !== 'matched';
  const initiatedByMe = match.initiatedBy === currentUserId;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const ok = await onSendMessage(text);
    if (ok) {
      setDraft('');
    }
  };

  const messages = match.conversation || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600"
          aria-label="Close concierge"
        >
          &times;
        </button>
        <div className="flex items-center gap-3">
          {partner && (
            <img
              src={partner.photoUrls?.[0] || `https://api.dicebear.com/7.x/initials/svg?seed=${partner.firstName}`}
              alt={partner.firstName}
              className="h-14 w-14 rounded-2xl object-cover"
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase text-slate-500 tracking-wide">Message concierge</p>
              {isPending && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                  Awaiting reply
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              {partner ? `Craft a thoughtful note for ${partner.firstName}` : 'Craft a thoughtful note'}
            </h2>
            <p className="text-sm text-slate-500">
              We save your opening lines so you can keep building the connection with intention.
            </p>
            {isPending && (
              <p className="mt-2 text-xs text-amber-600">
                {initiatedByMe
                  ? 'They haven\'t liked you back yet, but your message will land in their concierge right away.'
                  : `${partner ? partner.firstName : 'This match'} already liked you. Reply with intention even if you\'re still deciding.`}
              </p>
            )}
          </div>
        </div>

        <div ref={containerRef} className="mt-5 max-h-80 overflow-y-auto pr-1">
          {messages.length ? (
            <ul className="flex flex-col gap-3">
              {messages.map((message) => {
                const isMine = message.senderId === currentUserId;
                return (
                  <li key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow ${
                        isMine ? 'bg-brand-dark text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <p>{message.text}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide opacity-70">
                        {new Date(message.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              <p>
                Break the ice with a message that reflects your shared intentions. We&apos;ll suggest prompts as the concierge evolves.
              </p>
            </div>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write an intentional opener..."
            className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-dark focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="rounded-full bg-brand-dark px-6 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-brand-dark/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? 'Sending...' : 'Send note'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MatchConversationModal;
