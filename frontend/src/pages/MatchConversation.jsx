import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  StopIcon,
  NoSymbolIcon,
  VideoCameraSlashIcon,
} from '@heroicons/react/24/solid';
import { EllipsisVerticalIcon, FaceSmileIcon, PaperClipIcon, CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/20/solid';
import { api, useAuthStore } from '../store/auth.js';

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

const formatTime = (isoDate) =>
  new Date(isoDate).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds)) return '00:00';
  const safe = Math.max(0, Math.round(seconds));
  const mins = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const secs = (safe % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const chatBackgroundStyle = {
  backgroundColor: '#efeae2',
  backgroundImage:
    "url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27320%27 height=%27320%27 fill=%27none%27 viewBox=%270 0 160 160%27%3E%3Cg opacity=%270.22%27%3E%3Cpath fill=%23f7f2eb d=%27M0 0h160v160H0z%27/%3E%3Cpath stroke=%23d5c7b5 stroke-width=%271.6%27 d=%27M15 15h40v40H15zM105 15h40v40h-40zM60 105h40v40H60z%27/%3E%3Cpath stroke=%23d5c7b5 stroke-linecap=%27round%27 stroke-width=%271.6%27 d=%27M60 15l20 20 20-20M15 95l20 20-20 20M125 95l20 20-20 20%27/%3E%3C/g%3E%3C/svg%3E')",
  backgroundSize: '360px',
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const MatchConversation = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const attachmentInputRef = useRef(null);

  const [pendingVoiceNote, setPendingVoiceNote] = useState(null);
  const [recordingError, setRecordingError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const recordingChunksRef = useRef([]);
  const recorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordingStartRef = useRef(null);
  const shouldKeepRecordingRef = useRef(false);

  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [isVideoCallConnecting, setIsVideoCallConnecting] = useState(false);
  const [videoCallError, setVideoCallError] = useState('');
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  const cleanupVoiceNote = useCallback(() => {
    setPendingVoiceNote((prev) => {
      if (prev?.url) {
        URL.revokeObjectURL(prev.url);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      cleanupVoiceNote();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cleanupVoiceNote]);

  useEffect(() => {
    const loadMatch = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/match/mine');
        const allMatches = data?.data || [];
        const found = allMatches.find((item) => item.id === matchId);
        if (found) {
          setMatch(found);
          setError('');
        } else {
          setMatch(null);
          setError('This match is no longer available. Head back to your matches to explore more connections.');
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Could not load this conversation.');
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
    element.style.height = 'auto';
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

  const isPending = (match?.status || 'matched') !== 'matched';
  const statusText = isPending ? 'waiting for a response' : 'online';

  const stopRecordingInternal = useCallback(
    (shouldKeep) => {
      shouldKeepRecordingRef.current = shouldKeep;
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setIsRecording(false);
      if (!shouldKeep) {
        cleanupVoiceNote();
        setRecordingDuration(0);
      }
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      } else if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      }
      recorderRef.current = null;
    },
    [cleanupVoiceNote],
  );

  const handleStartRecording = async () => {
    if (isRecording) return;
    if (pendingVoiceNote) {
      cleanupVoiceNote();
    }
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setRecordingError('Voice notes are not supported in this browser.');
      return;
    }
    if (typeof window.MediaRecorder === 'undefined') {
      setRecordingError('Voice notes are not supported in this browser.');
      return;
    }
    try {
      setRecordingError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recordingChunksRef.current = [];
      shouldKeepRecordingRef.current = false;
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      });
      recorder.addEventListener('stop', () => {
        const activeStream = recordingStreamRef.current;
        if (activeStream) {
          activeStream.getTracks().forEach((track) => track.stop());
          recordingStreamRef.current = null;
        }
        const chunks = recordingChunksRef.current;
        recordingChunksRef.current = [];
        if (!shouldKeepRecordingRef.current || !chunks.length) {
          return;
        }
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const durationSeconds = Math.max(1, Math.round((Date.now() - (recordingStartRef.current || Date.now())) / 1000));
        setPendingVoiceNote((prev) => {
          if (prev?.url) {
            URL.revokeObjectURL(prev.url);
          }
          return { blob, url, duration: durationSeconds };
        });
        setRecordingDuration(durationSeconds);
      });
      recorder.start();
      recordingStartRef.current = Date.now();
      setRecordingDuration(0);
      setIsRecording(true);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(Math.max(0, Math.round((Date.now() - (recordingStartRef.current || Date.now())) / 1000)));
      }, 200);
    } catch (err) {
      console.error(err);
      setRecordingError("We couldn't access your microphone. Check your browser permissions.");
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      }
    }
  };

  const handleStopRecording = () => {
    if (!isRecording) return;
    stopRecordingInternal(true);
  };

  const handleCancelRecording = () => {
    if (isRecording) {
      stopRecordingInternal(false);
    } else {
      cleanupVoiceNote();
    }
  };

  const submitMessage = useCallback(
    async ({ text, voiceNote } = {}) => {
      const trimmedText = typeof text === 'string' ? text.trim() : '';
      const payload = {};
      if (trimmedText) {
        payload.text = trimmedText;
      }
      if (voiceNote) {
        payload.voiceNote = voiceNote;
      }
      if (!payload.text && !payload.voiceNote) {
        return;
      }
      if (!matchId) {
        return;
      }
      setSending(true);
      try {
        const { data } = await api.post(`/match/${matchId}/messages`, payload);
        const updated = data?.data?.match;
        if (updated) {
          setMatch(updated);
          setError('');
          setDraft('');
          if (payload.voiceNote) {
            cleanupVoiceNote();
          }
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Could not send your message. Try again.');
      } finally {
        setSending(false);
      }
    },
    [cleanupVoiceNote, matchId],
  );

  const handleSend = async (event) => {
    event.preventDefault();
    if (sending) return;
    const text = draft.trim();
    const hasVoiceNote = Boolean(pendingVoiceNote);
    if (!text && !hasVoiceNote) {
      return;
    }
    if (hasVoiceNote && pendingVoiceNote.blob.size > 5 * 1024 * 1024) {
      setError('Voice notes must be smaller than 5MB.');
      return;
    }

    let voiceNotePayload;
    if (hasVoiceNote) {
      try {
        const dataUrl = await blobToDataUrl(pendingVoiceNote.blob);
        voiceNotePayload = {
          dataUrl,
          mimeType: pendingVoiceNote.blob.type,
          duration: pendingVoiceNote.duration,
        };
      } catch (err) {
        console.error(err);
        setError('We could not process your voice note. Please try again.');
        return;
      }
    }

    await submitMessage({ text, voiceNote: voiceNotePayload });
  };

  const handleComposerKeyDown = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (sending) return;
      const text = draft.trim();
      if (!text) {
        return;
      }
      await submitMessage({ text });
    }
  };

  const handleInsertEmoji = () => {
    setDraft((prev) => `${prev}${prev ? ' ' : ''}:)`);
  };

  const handleAttachmentClick = () => {
    attachmentInputRef.current?.click();
  };

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const names = files.map((file) => file.name).join(', ');
    setDraft((prev) => `${prev}${prev ? '\n' : ''}[Attachment: ${names}]`);
    event.target.value = '';
    textareaRef.current?.focus();
  };

  const handleBack = () => {
    navigate('/matches');
  };

  const handleStartVideoCall = () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Video calls are not supported in this browser.');
      return;
    }
    setVideoCallError('');
    setIsVideoCallOpen(true);
  };

  const handleEndVideoCall = () => {
    setIsVideoCallOpen(false);
  };

  useEffect(() => {
    if (!isVideoCallOpen) {
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setVideoCallError('Video calls are not supported on this device.');
      return;
    }
    let cancelled = false;
    setIsVideoCallConnecting(true);
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = stream;
        stream.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });
        stream.getVideoTracks().forEach((track) => {
          track.enabled = true;
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsMicEnabled(true);
        setIsCameraEnabled(true);
        setIsVideoCallConnecting(false);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setVideoCallError('We could not access your camera or microphone. Check your browser permissions.');
          setIsVideoCallConnecting(false);
        }
      });

    return () => {
      cancelled = true;
      setIsVideoCallConnecting(false);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };
  }, [isVideoCallOpen]);

  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !isMicEnabled;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setIsMicEnabled(next);
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !isCameraEnabled;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setIsCameraEnabled(next);
  };

  const hasDraft = draft.trim().length > 0;
  const canSend = hasDraft || Boolean(pendingVoiceNote);

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
    <div className="relative flex h-[78vh] w-[140vh] flex-col overflow-hidden rounded-[2rem] border border-[#d1d7db] bg-[#f0f2f5] shadow-xl">
      <div className="flex items-center justify-between bg-[#4a3096] px-6 py-5 text-white shadow">
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
            src={
              partner?.photoUrls?.[0] ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${partner?.firstName || 'Kujuana'}`
            }
            alt={partner?.firstName}
            className="h-12 w-12 rounded-full border-2 border-white/30 object-cover shadow"
          />
          <div className="leading-tight">
            <h1 className="text-lg font-semibold">{partner ? partner.firstName : 'Your match'}</h1>
            <div className="flex items-center gap-2 text-xs text-white/80">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#40247f]" aria-hidden="true" />
              <span className="capitalize">{statusText}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5 text-white/80">
          <button
            type="button"
            onClick={handleStartVideoCall}
            className="transition hover:text-white"
            aria-label="Start video call"
          >
            <VideoCameraIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="cursor-not-allowed opacity-70"
            aria-label="Voice call coming soon"
            disabled
          >
            <PhoneIcon className="h-5 w-5" />
          </button>
          <button type="button" className="transition hover:text-white" aria-label="More options">
            <EllipsisVerticalIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6" style={chatBackgroundStyle}>
        <div className="space-y-4">
          {groupedMessages.length ? (
            groupedMessages.map((item) => {
              if (item.type === 'day') {
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
              const voiceNote = message.voiceNote && typeof message.voiceNote === 'object' ? message.voiceNote : null;
              return (
                <div key={item.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`relative max-w-[82%] rounded-2xl border px-3 py-2 text-[15px] leading-snug shadow-sm ${
                      isMine
                        ? 'rounded-br-md border-[#b7ddb0] bg-[#dcf8c6] text-[#1f2c34]'
                        : 'rounded-bl-md border-[#dfe1dc] bg-white text-[#1f2c34]'
                    }`}
                  >
                    {voiceNote ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <audio controls src={voiceNote.dataUrl} className="max-w-[210px]" preload="metadata" />
                          {voiceNote.duration ? (
                            <span className="text-xs text-[#6a7175]">{formatDuration(voiceNote.duration)}</span>
                          ) : null}
                        </div>
                        {message.text ? <p className="whitespace-pre-wrap">{message.text}</p> : null}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    )}
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
                      className={`absolute bottom-0 ${isMine ? 'right-[-6px]' : 'left-[-6px]'} h-3 w-3 rotate-45 ${
                        isMine
                          ? 'border-b border-r border-[#b7ddb0] bg-[#dcf8c6]'
                          : 'border-b border-l border-[#dfe1dc] bg-white'
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

      {recordingError && !isRecording && !pendingVoiceNote ? (
        <p className="px-6 text-sm text-rose-600">{recordingError}</p>
      ) : null}

      {isRecording ? (
        <div className="px-6">
          <div className="mb-2 flex items-center gap-3 rounded-2xl bg-white px-3 py-2 text-sm text-[#1f2c34] shadow">
            <span className="inline-flex h-2 w-2 animate-ping rounded-full bg-rose-500" aria-hidden="true" />
            <span className="font-medium">Recording... {formatDuration(recordingDuration)}</span>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelRecording}
                className="rounded-full bg-[#f0f2f5] px-3 py-1 text-xs font-semibold text-[#54656f] transition hover:bg-[#e1e4e7]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingVoiceNote ? (
        <div className="px-6">
          <div className="mb-2 flex items-center gap-3 rounded-2xl bg-white px-3 py-2 text-sm text-[#1f2c34] shadow">
            <audio controls src={pendingVoiceNote.url} className="max-w-[220px]" preload="metadata" />
            <span className="text-xs text-[#6a7175]">{formatDuration(pendingVoiceNote.duration)}</span>
            <button
              type="button"
              onClick={handleCancelRecording}
              className="ml-auto rounded-full bg-[#f0f2f5] px-3 py-1 text-xs font-semibold text-[#54656f] transition hover:bg-[#e1e4e7]"
            >
              Remove
            </button>
          </div>
        </div>
      ) : null}

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
          {canSend ? (
            <button
              type="submit"
              disabled={sending}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#4a3096] text-white transition hover:bg-[#37246e] disabled:opacity-60"
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
            </button>
          ) : isRecording ? (
            <button
              type="button"
              onClick={handleStopRecording}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d82148] text-white transition hover:bg-[#ba1739]"
              aria-label="Stop recording"
            >
              <StopIcon className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartRecording}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00A884] text-white transition hover:bg-[#02926f]"
              aria-label="Record voice note"
            >
              <MicrophoneIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {isVideoCallOpen ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative flex w-[90%] max-w-4xl flex-col gap-4 rounded-[32px] border border-white/15 bg-[#0b031f] p-6 text-white shadow-2xl">
            <button
              type="button"
              onClick={handleEndVideoCall}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 transition hover:bg-white/20"
              aria-label="Close video call"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative aspect-video overflow-hidden rounded-3xl bg-black/70">
                <video ref={localVideoRef} autoPlay playsInline muted className={`h-full w-full object-cover ${isCameraEnabled ? '' : 'opacity-40'}`} />
                {!isCameraEnabled ? (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
                    Camera off
                  </div>
                ) : null}
              </div>
              <div className="flex aspect-video items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-center text-sm text-white/70">
                {isVideoCallConnecting
                  ? 'Connecting to your camera and microphone...'
                  : `Waiting for ${partner?.firstName || 'your match'} to join`}
              </div>
            </div>
            {videoCallError ? <p className="text-sm text-rose-300">{videoCallError}</p> : null}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={toggleMic}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isMicEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-rose-600/80 hover:bg-rose-600'
                }`}
              >
                {isMicEnabled ? <MicrophoneIcon className="h-5 w-5" /> : <NoSymbolIcon className="h-5 w-5" />}
                <span>{isMicEnabled ? 'Mute mic' : 'Unmute mic'}</span>
              </button>
              <button
                type="button"
                onClick={toggleCamera}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isCameraEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-amber-500/80 hover:bg-amber-500'
                }`}
              >
                {isCameraEnabled ? <VideoCameraIcon className="h-5 w-5" /> : <VideoCameraSlashIcon className="h-5 w-5" />}
                <span>{isCameraEnabled ? 'Turn camera off' : 'Turn camera on'}</span>
              </button>
              <button
                type="button"
                onClick={handleEndVideoCall}
                className="flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
              >
                <PhoneIcon className="h-5 w-5" />
                <span>End call</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MatchConversation;
