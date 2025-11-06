import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/solid';
import { CheckIcon } from '@heroicons/react/20/solid';
import { FaceSmileIcon, PaperClipIcon, CameraIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import EmojiPicker from './EmojiPicker.jsx';

const FALLBACK_ROSTER = [
  { name: 'Keith', subtitle: 'Online', metric: '227.68' },
  { name: 'Reloara Ctillces', subtitle: 'Meece 181Y', metric: '234.58' },
  { name: 'Kaittidy', subtitle: 'Mecse 283Y', metric: '237.53' },
  { name: 'Noth Ceamaml', subtitle: 'Mcsee 109Y', metric: '233.59' },
  { name: 'Jaltse Shaerad', subtitle: 'Mcsee 189Y', metric: '237.43' },
  { name: 'Melilne', subtitle: 'Mcsee 124Y', metric: '287.58' },
  { name: 'Voith Boommall', subtitle: 'Mcsee 103Y', metric: '297.45' },
  { name: 'Netanell Semelats', subtitle: 'Mcsee 190Y', metric: '287.53' },
  { name: 'Paellast', subtitle: 'Mcsee 131Y', metric: '237.93' },
];

const formatDayLabel = (isoDate) => {
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatTime = (isoDate) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const chatBackgroundStyle = {
  backgroundColor: '#0b021f',
  backgroundImage:
    'radial-gradient(135%_160%_at_18%_-12%,rgba(199,162,255,0.32),rgba(21,7,52,0.9)_55%,rgba(8,2,31,0.98)_80%)',
};

const createAvatar = (seed) => `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed || 'Kujuana')}`;

const buildFallbackConversation = (myId, partnerId) => {
  const base = Date.now();
  const stamp = (minutesAgo) => new Date(base - minutesAgo * 60 * 1000).toISOString();

  return [
    {
      id: 'fallback-message-1',
      senderId: myId,
      text: 'Hey there! Your profile caught you eye. ??',
      createdAt: stamp(42),
      sideMetric: '815',
    },
    {
      id: 'fallback-message-2',
      senderId: myId,
      type: 'spacer',
      createdAt: stamp(38),
      sideMetric: '276',
      spacerWidth: 126,
      spacerHeight: 26,
    },
    {
      id: 'fallback-message-3',
      senderId: myId,
      type: 'spacer',
      createdAt: stamp(34),
      sideMetric: '105',
      spacerWidth: 164,
      spacerHeight: 30,
    },
    {
      id: 'fallback-message-4',
      senderId: myId,
      voiceNote: {
        label: 'woh leh voice note...',
        duration: '0:15',
        progress: 0.68,
      },
      createdAt: stamp(28),
      sideMetric: '7205',
    },
    {
      id: 'fallback-message-5',
      senderId: myId,
      voiceNote: {
        label: 'Sending a quick voice note...',
        duration: '0:15',
        progress: 0.35,
        highlight: true,
      },
      text: 'Sending a quick voice note...
(0:15)',
      createdAt: stamp(22),
      sideMetric: '225',
    },
    {
      id: 'fallback-message-6',
      senderId: partnerId,
      type: 'spacer',
      createdAt: stamp(16),
      sideMetric: '205',
      spacerWidth: 210,
      spacerHeight: 36,
      showTail: true,
    },
  ];
};

const cx = (...values) => values.filter(Boolean).join(' ');

const MatchConversationModal = ({ match, currentUserId, sending, error, onClose, onSendMessage }) => {
  const [draft, setDraft] = useState('');
  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const emojiButtonRef = useRef(null);

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);


  useEffect(() => {
    setDraft('');
    setIsEmojiPickerOpen(false);
  }, [match?.id]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [match?.conversation?.length]);

  useEffect(() => {
    if (!textareaRef.current) return;
    const element = textareaRef.current;
    element.style.height = 'auto';
    const nextHeight = Math.min(element.scrollHeight, 160);
    element.style.height = `${nextHeight}px`;
  }, [draft]);

  const partner = useMemo(() => {
    if (!match?.members?.length) return null;
    if (!currentUserId) return match.members[0];
    return match.members.find((member) => member.id !== currentUserId) || match.members[0];
  }, [match, currentUserId]);

  const myId = currentUserId || 'current-user';
  const partnerId = partner?.id || 'match-partner';
  const hasConversation = Array.isArray(match?.conversation) && match.conversation.length > 0;
  const messages = hasConversation ? match.conversation : buildFallbackConversation(myId, partnerId);

  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDayKey = '';
    messages.forEach((message) => {
      const dayKey = new Date(message.createdAt).toDateString();
      if (dayKey !== currentDayKey) {
        groups.push({ type: 'day', id: dayKey, label: formatDayLabel(message.createdAt) });
        currentDayKey = dayKey;
      }
      groups.push({ type: 'message', id: message.id, payload: message });
    });
    return groups;
  }, [messages]);

  const roster = useMemo(() => {
    const candidateLists = [
      match?.sidebarMatches,
      match?.relatedMatches,
      match?.otherMatches,
      match?.matches,
      match?.suggestions,
    ].filter((list) => Array.isArray(list) && list.length);

    if (candidateLists.length) {
      const [source] = candidateLists;
      return source.map((item, index) => {
        const contact = item.partner || item.matchPartner || item.profile || item;
        const name =
          [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim() ||
          contact.name ||
          `Connection ${index + 1}`;
        const subtitle =
          item.subtitle ||
          contact.subtitle ||
          contact.title ||
          [contact.location?.city, contact.location?.country].filter(Boolean).join(', ') ||
          contact.occupation ||
          'Online';
        const metric =
          item.metric ??
          item.compatibilityScore ??
          contact.compatibilityScore ??
          contact.score ??
          null;
        const avatar =
          contact.photoUrls?.[0] ||
          contact.photoUrl ||
          contact.avatar ||
          createAvatar(name || contact.id);
        const identifier = item.id || item.matchId || contact.id || `contact-${index}`;
        return {
          id: identifier,
          name,
          subtitle,
          metric,
          avatar,
          isActive:
            identifier === match?.id ||
            item.matchId === match?.id ||
            contact.id === partner?.id ||
            index === 0,
        };
      });
    }

    const base = partner
      ? [
          {
            id: match?.id || partner.id || 'primary-contact',
            name:
              [partner.firstName, partner.lastName].filter(Boolean).join(' ').trim() ||
              partner.firstName ||
              'Your match',
            subtitle:
              [partner.location?.city, partner.location?.country].filter(Boolean).join(', ') ||
              partner.occupation ||
              'Online',
            metric: '227.68',
            avatar: partner.photoUrls?.[0] || createAvatar(partner.firstName || partner.id),
            isActive: true,
          },
        ]
      : [];

    const fallback = FALLBACK_ROSTER.map((item, index) => ({
      id: `fallback-${index}`,
      name: item.name,
      subtitle: item.subtitle,
      metric: item.metric,
      avatar: createAvatar(item.name),
      isActive: !base.length && index === 0,
    }));

    return base.length ? [...base, ...fallback.slice(1)] : fallback;
  }, [match, partner]);

  const primaryContact = roster[0] || null;

  const primaryName =
    primaryContact?.name ||
    (partner ? [partner.firstName, partner.lastName].filter(Boolean).join(' ').trim() || partner.firstName : 'Your match');

  const primaryAvatar =
    primaryContact?.avatar ||
    partner?.photoUrls?.[0] ||
    createAvatar(primaryName || 'Kujuana');

  const primarySubtitle =
    primaryContact?.subtitle ||
    (partner
      ? [partner.location?.city, partner.location?.country].filter(Boolean).join(', ') ||
        partner.occupation ||
        'Online'
      : 'Online');

  if (!match) return null;

  const isPending = (match.status || 'matched') !== 'matched';
  const initiatedByMe = match.initiatedBy === currentUserId;
  const hasDraft = draft.trim().length > 0;

  const emojiButtonClasses = [
    'flex h-11 w-11 items-center justify-center rounded-full bg-white/0 text-white/65 transition hover:bg-white/12 hover:text-white',
    isEmojiPickerOpen ? 'bg-white/12 text-white' : '',
  ].join(' ');


  const submitMessage = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    const ok = await onSendMessage(text);
    if (ok) {
      setDraft('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submitMessage();
  };

  const handleComposerKeyDown = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await submitMessage();
    }
  };

  const handleToggleEmojiPicker = useCallback(() => {
    setIsEmojiPickerOpen((prev) => !prev);
  }, []);

  const handleEmojiSelect = useCallback((emoji) => {
    if (!emoji) return;
    setDraft((prev) => {
      const needsSpacer = prev && !/\s$/.test(prev);
      return `${prev}${needsSpacer ? ' ' : ''}${emoji}`;
    });
    setIsEmojiPickerOpen(false);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, []);

  const handleAttachmentClick = () => {
    setIsEmojiPickerOpen(false);
    attachmentInputRef.current?.click();
  };

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const names = files.map((file) => file.name).join(', ');
    setDraft((prev) => `${prev}${prev ? '
' : ''}[Attachment: ${names}]`);
    event.target.value = '';
    textareaRef.current?.focus();
  };

  const handleClose = () => {
    onClose();
    setDraft('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 py-12 bg-[#120536] bg-[radial-gradient(circle_at_6%_-12%,rgba(158,120,255,0.55),rgba(9,3,27,0.95)_72%)]">
      <div className="relative flex h-[80vh] w-full max-w-5xl overflow-hidden rounded-[46px] border border-white/12 bg-[#0b031f]/82 shadow-[0_55px_140px_rgba(8,3,26,0.62)] backdrop-blur-[28px]">
        <button
          type="button"
          onClick={handleClose}
          className="absolute left-6 top-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Close conversation"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>

        <div className="flex h-full w-full">
          <aside className="flex w-[30%] min-w-[240px] flex-col bg-gradient-to-b from-[#8a6aff] via-[#2c1677] to-[#08011d] text-white/85">
            <div className="px-7 pt-16 pb-8">
              <div className="flex items-center gap-4">
                <img
                  src={primaryAvatar}
                  alt={primaryName}
                  className="h-14 w-14 rounded-full border-2 border-white/30 object-cover shadow-[0_18px_40px_rgba(12,5,33,0.45)]"
                />
                <div className="space-y-1">
                  <p className="text-lg font-semibold leading-tight text-white">{primaryName}</p>
                  <p className="text-xs text-white/65">{primarySubtitle}</p>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/60">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#40247f]" aria-hidden="true" />
                    <span>{isPending ? 'Waiting' : 'Online'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-9">
              <div className="space-y-2">
                {roster.map((contact) => (
                  <div
                    key={contact.id}
                    className={cx(
                      'flex items-center justify-between rounded-[1.8rem] border px-4 py-3 transition-all',
                      contact.isActive
                        ? 'border-white/25 bg-white/18 shadow-[0_22px_45px_rgba(12,4,36,0.35)]'
                        : 'border-white/5 bg-white/0 hover:border-white/15 hover:bg-white/10 hover:shadow-[0_18px_40px_rgba(12,4,36,0.28)]'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="h-10 w-10 rounded-full border border-white/15 object-cover"
                      />
                      <div className="leading-tight">
                        <p className="text-sm font-semibold text-white">{contact.name}</p>
                        <p className="text-[11px] text-white/60">{contact.subtitle}</p>
                      </div>
                    </div>
                    {contact.metric ? (
                      <span className="text-[11px] font-medium text-white/45">{contact.metric}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="flex flex-1 flex-col text-white bg-[radial-gradient(145%_160%_at_12%_-10%,rgba(155,116,255,0.32),rgba(10,3,28,0.98))]">
            <div className="border-b border-white/12 px-10 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <img
                    src={primaryAvatar}
                    alt={primaryName}
                    className="h-12 w-12 rounded-full border border-white/20 object-cover shadow-[0_20px_45px_rgba(10,4,33,0.45)]"
                  />
                  <div className="leading-tight">
                    <h2 className="text-xl font-semibold text-white">{primaryName}</h2>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#40247f]" aria-hidden="true" />
                      <span>{isPending ? 'Waiting for a response' : 'Online now'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-white/70">
                  <MagnifyingGlassIcon className="h-5 w-5 transition hover:text-white" aria-hidden="true" />
                  <PhoneIcon className="h-5 w-5 transition hover:text-white" aria-hidden="true" />
                  <VideoCameraIcon className="h-5 w-5 transition hover:text-white" aria-hidden="true" />
                </div>
              </div>
            </div>

            <div ref={containerRef} className="flex-1 overflow-y-auto px-10 py-9" style={chatBackgroundStyle}>
              <div className="space-y-6">
                {groupedMessages.length ? (
                  groupedMessages.map((item) => {
                    if (item.type === 'day') {
                      return (
                        <div key={item.id} className="flex justify-center">
                          <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1 text-[11px] uppercase tracking-[0.18em] text-white/60">
                            {item.label}
                          </span>
                        </div>
                      );
                    }

                    const message = item.payload;
                    const isMine = message.senderId === myId;
                    const variant = message.type || message.variant || 'message';
                    const isSpacer = variant === 'spacer';
                    const voiceNote = message.voiceNote || null;
                    const bubbleBaseClasses =
                      'relative max-w-[76%] rounded-[26px] border text-[15px] leading-relaxed shadow-[0_22px_50px_rgba(10,4,28,0.45)] transition-all';
                    const bubblePadding = isSpacer ? 'px-8 py-3' : 'px-6 py-4';
                    const bubblePalette = voiceNote
                      ? isMine
                        ? voiceNote.highlight
                          ? 'border-transparent bg-gradient-to-br from-[#f5eaff] via-[#d9c7ff] to-[#a88dff] text-[#1c0f3f]'
                          : 'border-[#cdbbff]/50 bg-[#c2acff]/95 text-[#1e0c49]'
                        : 'border-white/12 bg-white/12 text-white/85 backdrop-blur'
                      : isSpacer
                      ? isMine
                        ? 'border-[#e3d7ff]/40 bg-[#d2c2ff]/45 text-transparent'
                        : 'border-white/12 bg-white/12 text-transparent'
                      : isMine
                      ? 'border-[#e7d9ff]/55 bg-[#cdb7ff]/95 text-[#190a3f]'
                      : 'border-white/12 bg-white/10 text-white/80 backdrop-blur';
                    const tailPalette = isMine
                      ? voiceNote && voiceNote.highlight
                        ? 'right-7 border-transparent bg-[#d6c4ff]'
                        : 'right-7 border-transparent bg-[#c7b1ff]/95'
                      : 'left-7 border-transparent bg-white/10';
                    const timestamp = formatTime(message.createdAt);
                    const noteProgress =
                      voiceNote && typeof voiceNote.progress === 'number'
                        ? Math.min(Math.max(voiceNote.progress, 0), 1)
                        : null;
                    const metaClass = isMine
                      ? voiceNote
                        ? 'justify-end text-[#42298c]'
                        : 'justify-end text-[#40247f]'
                      : 'justify-start text-white/60';
                    const bubbleStyle = {};
                    if (isSpacer) {
                      bubbleStyle.minHeight = message.spacerHeight || 28;
                      bubbleStyle.minWidth = message.spacerWidth || 120;
                    }
                    const sideMetric = message.sideMetric;
                    const showMeta = !isSpacer && (timestamp || isMine);
                    const showTail = !isSpacer || message.showTail;
                    const alignmentClass = isMine ? 'justify-end' : 'justify-start';
                    const bubbleClasses = cx(bubbleBaseClasses, bubblePadding, bubblePalette);

                    return (
                      <div key={item.id} className={cx('flex', alignmentClass)}>
                        <div className={bubbleClasses} style={bubbleStyle}>
                          {sideMetric ? (
                            <span
                              className={cx(
                                'pointer-events-none absolute -right-12 top-1 text-[11px] tracking-[0.28em]',
                                isMine ? 'text-[#5e47bf]' : 'text-white/55'
                              )}
                            >
                              {sideMetric}
                            </span>
                          ) : null}
                          {voiceNote ? (
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-4">
                                <span
                                  className={cx(
                                    'flex h-11 w-11 items-center justify-center rounded-full',
                                    isMine ? 'bg-[#2c185d]/12 text-[#3f2490]' : 'bg-white/15 text-white/85'
                                  )}
                                >
                                  <SpeakerWaveIcon className="h-6 w-6" />
                                </span>
                                <div className="flex-1 space-y-2">
                                  <p className={cx('text-sm font-semibold', isMine ? 'text-[#2f1d64]' : 'text-white/90')}>
                                    {voiceNote.label || 'Voice note'}
                                  </p>
                                  {voiceNote.duration ? (
                                    <div
                                      className={cx(
                                        'flex items-center gap-2 text-xs',
                                        isMine ? 'text-[#4a3096]' : 'text-white/70'
                                      )}
                                    >
                                      <span
                                        className={cx(
                                          'inline-flex h-1 w-1 rounded-full',
                                          isMine ? 'bg-[#4a3096]' : 'bg-white/60'
                                        )}
                                        aria-hidden="true"
                                      />
                                      <span>{voiceNote.duration}</span>
                                    </div>
                                  ) : null}
                                  {noteProgress !== null ? (
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                                      <div
                                        className={cx('h-full', isMine ? 'bg-[#4f33a5]' : 'bg-white/70')}
                                        style={{ width: `${noteProgress * 100}%` }}
                                      />
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              {message.text ? (
                                <p className={cx('whitespace-pre-wrap text-sm', isMine ? 'text-[#291658]' : 'text-white/80')}>
                                  {message.text}
                                </p>
                              ) : null}
                            </div>
                          ) : isSpacer ? null : (
                            <p className="whitespace-pre-wrap">{message.text}</p>
                          )}
                          {showMeta ? (
                            <div className={cx('mt-3 flex items-center gap-1 text-[11px]', metaClass)}>
                              {timestamp ? <span>{timestamp}</span> : null}
                              {isMine && (
                                <span className="flex items-center" aria-label="Delivered">
                                  <CheckIcon className="h-3 w-3" />
                                  <CheckIcon className="h-3 w-3 -ml-2" />
                                </span>
                              )}
                            </div>
                          ) : null}
                          {showTail ? (
                            <span className={cx('absolute bottom-[-7px] h-4 w-4 rotate-45 border', tailPalette)} aria-hidden="true" />
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="mx-auto max-w-sm rounded-[1.75rem] border border-white/12 bg-white/5 px-6 py-5 text-center text-sm text-white/75 shadow-[0_28px_55px_rgba(10,4,33,0.35)]">
                    <p>
                      {initiatedByMe
                        ? 'Break the ice with a thoughtful note. Your message is saved so you can keep building momentum.'
                        : 'They already liked you. Reply with intention to keep the connection moving forward.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {error && <p className="px-10 pb-3 text-sm text-rose-300">{error}</p>}

            <form onSubmit={handleSubmit} className="px-10 pb-8 pt-4">
              <div className="relative flex items-center gap-3 rounded-full border border-white/18 bg-[#18063a]/80 px-6 py-3.5 text-white shadow-[0_45px_90px_rgba(10,4,30,0.55)] backdrop-blur-lg">
                {isEmojiPickerOpen ? (
                  <EmojiPicker
                    anchorRef={emojiButtonRef}
                    onSelect={handleEmojiSelect}
                    onClose={() => setIsEmojiPickerOpen(false)}
                    variant="dark"
                  />
                ) : null}
                <button
                  type="button"
                  ref={emojiButtonRef}
                  onClick={handleToggleEmojiPicker}
                  className={emojiButtonClasses}
                  aria-label="Add emoji"
                >
                  <FaceSmileIcon className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={handleAttachmentClick}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/0 text-white/65 transition hover:bg-white/12 hover:text-white"
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
                  className="max-h-40 flex-1 resize-none border-0 bg-transparent text-[15px] leading-tight text-white/95 placeholder:text-white/45 focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={handleAttachmentClick}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/0 text-white/65 transition hover:bg-white/12 hover:text-white"
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
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#d9c7ff] via-[#b99dff] to-[#8f77ff] text-[#150937] transition hover:from-[#e7d9ff] hover:via-[#c5a9ff] hover:to-[#9c84ff] disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Send message"
                  >
                    <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmojiPickerOpen(false);
                      setDraft('Sending a quick voice note...');
                    }}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#cdb5ff] via-[#a988ff] to-[#7b5bff] text-[#16083f] transition hover:from-[#dcc7ff] hover:via-[#b695ff] hover:to-[#8a6aff]"
                    aria-label="Record voice message"
                  >
                    <MicrophoneIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MatchConversationModal;
