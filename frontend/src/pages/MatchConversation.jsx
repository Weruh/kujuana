import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  StopIcon,
  NoSymbolIcon,
  VideoCameraSlashIcon,
} from "@heroicons/react/24/solid";
import {
  EllipsisVerticalIcon,
  FaceSmileIcon,
  PaperClipIcon,
  CameraIcon,
  XMarkIcon,
  UserPlusIcon,
  UserIcon,
  PhotoIcon,
  MapPinIcon,
  DocumentArrowUpIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/20/solid";
import { api, useAuthStore } from "../store/auth.js";
import EmojiPicker from "../components/EmojiPicker.jsx";
import {
  buildMapUrl,
  DOCUMENT_ACCEPT_STRING as DOCUMENT_ACCEPT,
  formatFileSize,
  isAllowedDocumentFile,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
  normalizeAttachmentsForDisplay,
  resolveDocumentMimeType,
} from "../utils/attachments.js";

const formatDayLabel = (isoDate) => {
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (isoDate) =>
  new Date(isoDate).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds)) return "00:00";
  const safe = Math.max(0, Math.round(seconds));
  const mins = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const secs = (safe % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

const formatCoordinate = (value) => {
  if (!Number.isFinite(value)) return "";
  return value.toFixed(5);
};

const chatBackgroundStyle = {
  backgroundColor: "#e5ddd5",
  backgroundImage:
    "url('data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cg fill='none' stroke='%23d0c3ab' stroke-width='1.1' opacity='0.55'%3E%3Ccircle cx='90' cy='90' r='16'/%3E%3Cpath d='M10 220h70v22H10z'/%3E%3Cpath d='M260 60l30 30-30 30-30-30z'/%3E%3Cpath d='M330 250h45v20h-45z'/%3E%3Cpath d='M150 320l18 18-18 18-18-18z'/%3E%3Cpath d='M220 300c18 0 18 26 0 26s-18-26 0-26z'/%3E%3C/g%3E%3C/svg%3E')",
  backgroundSize: "420px",
  backgroundPosition: "center",
  overscrollBehaviorY: "contain",
};

const conversationFontStyle = {
  fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const loadImageDimensions = (dataUrl) =>
  new Promise((resolve) => {
    if (typeof window === "undefined" || typeof Image === "undefined") {
      resolve({ width: 0, height: 0 });
      return;
    }
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      resolve({
        width: image.naturalWidth || image.width || 0,
        height: image.naturalHeight || image.height || 0,
      });
      image.onload = null;
      image.onerror = null;
    };
    image.onerror = () => {
      resolve({ width: 0, height: 0 });
      image.onload = null;
      image.onerror = null;
    };
    image.src = dataUrl;
  });

const revokeObjectUrl = (value) => {
  if (!value) return;
  if (typeof URL === "undefined" || typeof URL.revokeObjectURL !== "function")
    return;
  try {
    URL.revokeObjectURL(value);
  } catch {}
};

const isNearBottom = (el, threshold = 80) =>
  el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;

const MatchConversation = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState([]);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const attachmentsRef = useRef([]);
  const emojiButtonRef = useRef(null);
  const paperclipButtonRef = useRef(null);
  const attachmentMenuRef = useRef(null);
  const documentInputRef = useRef(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [pendingVoiceNote, setPendingVoiceNote] = useState(null);
  const [recordingError, setRecordingError] = useState("");
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
  const [videoCallError, setVideoCallError] = useState("");
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const [isVoiceCallConnecting, setIsVoiceCallConnecting] = useState(false);
  const [voiceCallError, setVoiceCallError] = useState("");
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [voiceCallDuration, setVoiceCallDuration] = useState(0);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const voiceCallStreamRef = useRef(null);
  const voiceCallTimerRef = useRef(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  const cleanupVoiceNote = useCallback(() => {
    setPendingVoiceNote((prev) => {
      if (prev?.url) revokeObjectUrl(prev.url);
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      cleanupVoiceNote();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (voiceCallTimerRef.current) clearInterval(voiceCallTimerRef.current);
      if (voiceCallStreamRef.current) {
        voiceCallStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cleanupVoiceNote]);

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
          setTimeout(() => {
            const el = scrollRef.current;
            if (el) {
              el.scrollTop = el.scrollHeight;
              setStickToBottom(true);
            }
          }, 0);
        } else {
          setMatch(null);
          setError(
            "This match is no longer available. Head back to your matches to explore more connections."
          );
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Could not load this conversation."
        );
        setMatch(null);
      } finally {
        setLoading(false);
      }
    };
    if (matchId) loadMatch();
  }, [matchId]);

  const partner = useMemo(() => {
    if (!match?.members?.length) return null;
    if (!currentUserId) return match.members[0];
    return (
      match.members.find((member) => member.id !== currentUserId) ||
      match.members[0]
    );
  }, [match, currentUserId]);

  const partnerName = partner
    ? partner.firstName || partner.lastName || "Match"
    : "Match";

  const messages = match?.conversation || [];

  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDayKey = "";
    messages.forEach((message) => {
      const dayKey = new Date(message.createdAt).toDateString();
      if (dayKey !== currentDayKey) {
        groups.push({
          type: "day",
          id: dayKey,
          label: formatDayLabel(message.createdAt),
        });
        currentDayKey = dayKey;
      }
      groups.push({ type: "message", id: message.id, payload: message });
    });
    return groups;
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (stickToBottom) el.scrollTop = el.scrollHeight;
  }, [groupedMessages.length, stickToBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setStickToBottom(isNearBottom(el));
    el.addEventListener("scroll", onScroll, { passive: true });
    setStickToBottom(isNearBottom(el));
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!textareaRef.current) return;
    const element = textareaRef.current;
    element.style.height = "auto";
    const nextHeight = Math.min(element.scrollHeight, 96);
    element.style.height = `${nextHeight}px`;
  }, [draft]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((item) => {
        if (item?.previewUrl) revokeObjectUrl(item.previewUrl);
      });
    };
  }, []);

  const isPending = (match?.status || "matched") !== "matched";
  const statusText = isPending ? "waiting for a response" : "online";

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
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      } else if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      }
      recorderRef.current = null;
    },
    [cleanupVoiceNote]
  );

  const clearAttachments = useCallback(() => {
    setAttachments((prev) => {
      if (!prev.length) return prev;
      prev.forEach((item) => {
        if (item?.previewUrl) revokeObjectUrl(item.previewUrl);
      });
      return [];
    });
  }, []);

  const handleRemoveAttachment = useCallback(
    (attachmentId) => {
      if (!attachmentId) return;
      setAttachments((prev) => {
        if (!prev.length) return prev;
        const next = [];
        prev.forEach((item) => {
          if (item.id === attachmentId) {
            if (item?.previewUrl) revokeObjectUrl(item.previewUrl);
          } else {
            next.push(item);
          }
        });
        return next;
      });
      setError("");
    },
    [setError]
  );

  const handleStartRecording = async () => {
    if (isRecording) return;
    if (pendingVoiceNote) cleanupVoiceNote();
    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setRecordingError("Voice notes are not supported in this browser.");
      return;
    }
    if (typeof window.MediaRecorder === "undefined") {
      setRecordingError("Voice notes are not supported in this browser.");
      return;
    }
    try {
      setRecordingError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recordingChunksRef.current = [];
      shouldKeepRecordingRef.current = false;
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      });
      recorder.addEventListener("stop", () => {
        const activeStream = recordingStreamRef.current;
        if (activeStream) {
          activeStream.getTracks().forEach((track) => track.stop());
          recordingStreamRef.current = null;
        }
        const chunks = recordingChunksRef.current;
        recordingChunksRef.current = [];
        if (!shouldKeepRecordingRef.current || !chunks.length) return;
        const blob = new Blob(chunks, {
          type: recorder.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        const durationSeconds = Math.max(
          1,
          Math.round(
            (Date.now() - (recordingStartRef.current || Date.now())) / 1000
          )
        );
        setPendingVoiceNote((prev) => {
          if (prev?.url) revokeObjectUrl(prev.url);
          return { blob, url, duration: durationSeconds };
        });
        setRecordingDuration(durationSeconds);
      });
      recorder.start();
      recordingStartRef.current = Date.now();
      setRecordingDuration(0);
      setIsRecording(true);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(
          Math.max(
            0,
            Math.round(
              (Date.now() - (recordingStartRef.current || Date.now())) / 1000
            )
          )
        );
      }, 200);
    } catch (err) {
      setRecordingError(
        "We couldn't access your microphone. Check your browser permissions."
      );
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
    async ({ text, voiceNote, attachments: outgoingAttachments } = {}) => {
      const trimmedText = typeof text === "string" ? text.trim() : "";
      const payload = {};
      if (trimmedText) payload.text = trimmedText;
      if (voiceNote) payload.voiceNote = voiceNote;
      const hasAttachments =
        Array.isArray(outgoingAttachments) && outgoingAttachments.length > 0;
      if (hasAttachments) payload.attachments = outgoingAttachments;
      if (
        !payload.text &&
        !payload.voiceNote &&
        !(payload.attachments && payload.attachments.length)
      ) {
        return;
      }
      if (!matchId) return;
      setSending(true);
      try {
        const { data } = await api.post(`/match/${matchId}/messages`, payload);
        const updated = data?.data?.match;
        if (updated) {
          setMatch(updated);
          setError("");
          setDraft("");
          if (payload.voiceNote) cleanupVoiceNote();
          if (payload.attachments?.length) clearAttachments();
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Could not send your message. Try again."
        );
      } finally {
        setSending(false);
      }
    },
    [cleanupVoiceNote, clearAttachments, matchId]
  );

  const buildOutgoingAttachments = () => {
    return attachments
      .map((item, index) => {
        if (!item) return null;
        const safeId =
          item.id ||
          `attachment-${Date.now()}-${index}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;
        const kind =
          typeof item.kind === "string" ? item.kind.toLowerCase() : "image";
        if (kind === "location") {
          const lat = Number(item.lat);
          const lng = Number(item.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          const payload = { id: safeId, kind: "location", lat, lng };
          if (typeof item.label === "string" && item.label.trim()) {
            payload.label = item.label.trim();
          }
          if (typeof item.mapUrl === "string" && item.mapUrl) {
            payload.mapUrl = item.mapUrl;
          }
          if (Number.isFinite(item.accuracy)) {
            payload.accuracy = Math.round(Number(item.accuracy));
          }
          return payload;
        }
        if (kind === "contact") {
          const name = typeof item.name === "string" ? item.name.trim() : "";
          const phone = typeof item.phone === "string" ? item.phone.trim() : "";
          const email = typeof item.email === "string" ? item.email.trim() : "";
          const note = typeof item.note === "string" ? item.note.trim() : "";
          if (!name && !phone && !email && !note) return null;
          const payload = { id: safeId, kind: "contact" };
          if (name) payload.name = name;
          if (phone) payload.phone = phone;
          if (email) payload.email = email;
          if (note) payload.note = note;
          return payload;
        }
        const dataUrl = item.dataUrl;
        if (typeof dataUrl !== "string" || !dataUrl) return null;
        const isDocument = kind === "document";
        const payload = {
          id: safeId,
          kind: isDocument ? "document" : "image",
          dataUrl,
          mimeType:
            item.mimeType ||
            (isDocument
              ? resolveDocumentMimeType(item.name) || "application/octet-stream"
              : "image/*"),
        };
        if (typeof item.name === "string" && item.name.trim()) {
          payload.name = item.name.trim();
        }
        const parsedSize = Number(item.size);
        if (Number.isFinite(parsedSize) && parsedSize > 0) {
          payload.size = Math.round(parsedSize);
        }
        if (!isDocument) {
          const parsedWidth = Number(item.width);
          if (Number.isFinite(parsedWidth) && parsedWidth > 0) {
            payload.width = Math.round(parsedWidth);
          }
          const parsedHeight = Number(item.height);
          if (Number.isFinite(parsedHeight) && parsedHeight > 0) {
            payload.height = Math.round(parsedHeight);
          }
        }
        return payload;
      })
      .filter(Boolean);
  };

  const attemptSend = async () => {
    if (sending) return;
    const text = draft.trim();
    const attachmentPayload = buildOutgoingAttachments();
    const hasAttachments = attachmentPayload.length > 0;
    if (!text && !hasAttachments && !pendingVoiceNote) return;
    let voiceNotePayload;
    if (pendingVoiceNote?.blob) {
      try {
        const dataUrl = await blobToDataUrl(pendingVoiceNote.blob);
        voiceNotePayload = {
          id: pendingVoiceNote.id || `voice-${Date.now()}`,
          dataUrl,
          mimeType: pendingVoiceNote.blob.type || "audio/webm",
          duration: pendingVoiceNote.duration,
        };
      } catch {
        setError("We could not process your voice note. Please try again.");
        return;
      }
    }
    setError("");
    setIsEmojiPickerOpen(false);
    await submitMessage({
      text,
      voiceNote: voiceNotePayload,
      attachments: attachmentPayload,
    });
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
      setStickToBottom(true);
    }
  };

  const handleComposerKeyDown = async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await attemptSend();
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    await attemptSend();
  };

  const closeAttachmentMenu = useCallback(() => {
    setIsAttachmentMenuOpen(false);
  }, []);

  const handleToggleEmojiPicker = useCallback(() => {
    closeAttachmentMenu();
    setIsEmojiPickerOpen((prev) => !prev);
  }, [closeAttachmentMenu]);

  const handleEmojiSelect = useCallback((emoji) => {
    if (!emoji) return;
    setDraft((prev) => {
      const needsSpacer = prev && !/\s$/.test(prev);
      return `${prev}${needsSpacer ? " " : ""}${emoji}`;
    });
    setIsEmojiPickerOpen(false);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, []);

  const openImagePicker = useCallback(() => {
    if (attachments.length >= MAX_ATTACHMENTS) {
      setError(`You can share up to ${MAX_ATTACHMENTS} attachments per message.`);
      return;
    }
    setIsEmojiPickerOpen(false);
    setError("");
    const input = attachmentInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }, [attachments.length, setError]);

  const handleAttachmentClick = () => {
    setIsEmojiPickerOpen(false);
    setIsAttachmentMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isAttachmentMenuOpen || typeof document === "undefined") return;
    const handleClick = (event) => {
      const menuEl = attachmentMenuRef.current;
      const buttonEl = paperclipButtonRef.current;
      if (
        !menuEl ||
        menuEl.contains(event.target) ||
        buttonEl?.contains?.(event.target)
      ) {
        return;
      }
      closeAttachmentMenu();
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeAttachmentMenu();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeAttachmentMenu, isAttachmentMenuOpen]);

  const appendDraftSnippet = useCallback(
    (snippet) => {
      setDraft((prev) => (prev ? `${prev}\n${snippet}` : snippet));
      closeAttachmentMenu();
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    },
    [closeAttachmentMenu]
  );

  const handleShareContact = useCallback(() => {
    closeAttachmentMenu();
    if (attachments.length >= MAX_ATTACHMENTS) {
      setError(`You can share up to ${MAX_ATTACHMENTS} attachments per message.`);
      return;
    }
    if (typeof window === "undefined") {
      appendDraftSnippet("[Shared contact card]");
      return;
    }
    const nameInput = window.prompt(
      "Enter the contact name (required unless you add a phone/email):",
      ""
    );
    if (nameInput === null) return;
    const phoneInput = window.prompt(
      "Enter the contact phone number (optional):",
      ""
    );
    if (phoneInput === null) return;
    const emailInput = window.prompt(
      "Enter the contact email address (optional):",
      ""
    );
    if (emailInput === null) return;
    const name = nameInput.trim();
    const phone = phoneInput.trim();
    const email = emailInput.trim();
    if (!name && !phone && !email) {
      setError("Add at least a name, phone number, or email before sharing a contact.");
      return;
    }
    const contactAttachment = {
      id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: "contact",
    };
    if (name) contactAttachment.name = name;
    if (phone) contactAttachment.phone = phone;
    if (email) contactAttachment.email = email;
    setAttachments((prev) => [...prev, contactAttachment]);
    setError("");
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, [appendDraftSnippet, attachments.length, closeAttachmentMenu, setError]);

  const handleShareImages = useCallback(() => {
    closeAttachmentMenu();
    openImagePicker();
  }, [closeAttachmentMenu, openImagePicker]);

  const handleShareLocation = useCallback(() => {
    closeAttachmentMenu();
    if (attachments.length >= MAX_ATTACHMENTS) {
      setError(`You can share up to ${MAX_ATTACHMENTS} attachments per message.`);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Location sharing is not supported on this device.");
      return;
    }
    setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = coords?.latitude;
        const lng = coords?.longitude;
        const accuracy = coords?.accuracy;
        if (typeof lat !== "number" || typeof lng !== "number") {
          setError("We could not read your coordinates. Try again.");
          return;
        }
        const attachmentId = `location-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        const locationAttachment = {
          id: attachmentId,
          kind: "location",
          lat,
          lng,
          label: "Shared location",
          mapUrl: buildMapUrl(lat, lng),
        };
        if (typeof accuracy === "number") {
          locationAttachment.accuracy = accuracy;
        }
        setAttachments((prev) => {
          if (prev.length >= MAX_ATTACHMENTS) {
            setError(`You can share up to ${MAX_ATTACHMENTS} attachments per message.`);
            return prev;
          }
          return [...prev, locationAttachment];
        });
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      },
      () => {
        setError("We could not access your location. Check your browser permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [attachments.length, closeAttachmentMenu, setError]);

  const handleShareDocuments = useCallback(() => {
    closeAttachmentMenu();
    if (attachments.length >= MAX_ATTACHMENTS) {
      setError(`You can share up to ${MAX_ATTACHMENTS} attachments per message.`);
      return;
    }
    const input = documentInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }, [attachments.length, closeAttachmentMenu, setError]);

  const handleCameraClick = useCallback(() => {
    closeAttachmentMenu();
    openImagePicker();
  }, [closeAttachmentMenu, openImagePicker]);

  const handleAttachmentChange = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const imageFiles = files.filter(
      (file) =>
        file && typeof file.type === "string" && file.type.startsWith("image/")
    );
    if (!imageFiles.length) {
      setError("Only image attachments are supported right now.");
      return;
    }
    const availableSlots = MAX_ATTACHMENTS - attachments.length;
    if (availableSlots <= 0) {
      setError(`You can share up to ${MAX_ATTACHMENTS} attachments per message.`);
      return;
    }
    const selection = imageFiles.slice(0, availableSlots);
    const oversize = selection.find((file) => file.size > MAX_ATTACHMENT_BYTES);
    if (oversize) {
      setError("Images must be 5MB or smaller.");
      return;
    }
    try {
      const prepared = await Promise.all(
        selection.map(async (file, index) => {
          const dataUrl = await blobToDataUrl(file);
          const { width, height } = await loadImageDimensions(dataUrl);
          const previewUrl =
            typeof URL !== "undefined" &&
            typeof URL.createObjectURL === "function"
              ? URL.createObjectURL(file)
              : null;
          return {
            id: `attachment-${Date.now()}-${index}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
            kind: "image",
            name: file.name,
            size: file.size,
            mimeType: file.type || "image/*",
            dataUrl,
            width,
            height,
            previewUrl,
          };
        })
      );
      setAttachments((prev) => [...prev, ...prepared]);
      setError("");
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    } catch {
      setError("We could not process one of your images. Please try again.");
    }
  };

  const handleDocumentChange = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const availableSlots = MAX_ATTACHMENTS - attachments.length;
    if (availableSlots <= 0) {
      setError(`You can share up to ${MAX_ATTACHMENTS} attachments per message.`);
      return;
    }
    const allowed = files.filter((file) => isAllowedDocumentFile(file));
    if (!allowed.length) {
      setError(
        "That file type is not supported. Try PDF, Word, Excel, PowerPoint, TXT, or RTF files."
      );
      return;
    }
    const selection = allowed.slice(0, availableSlots);
    const oversized = selection.find(
      (file) => file.size > MAX_ATTACHMENT_BYTES
    );
    if (oversized) {
      setError("Documents must be 5MB or smaller.");
      return;
    }
    try {
      const prepared = await Promise.all(
        selection.map(async (file, index) => {
          const dataUrl = await blobToDataUrl(file);
          return {
            id: `document-${Date.now()}-${index}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
            kind: "document",
            name: file.name,
            size: file.size,
            mimeType:
              resolveDocumentMimeType(file) || "application/octet-stream",
            dataUrl,
          };
        })
      );
      setAttachments((prev) => [...prev, ...prepared]);
      setError("");
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    } catch {
      setError("We could not process one of your documents. Please try again.");
    }
  };

  const handleBack = () => {
    navigate("/matches");
  };

  const handleStartVoiceCall = () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setVoiceCallError("Voice calls are not supported in this browser.");
      return;
    }
    setVoiceCallError("");
    if (isVideoCallOpen) setIsVideoCallOpen(false);
    setIsVoiceCallOpen(true);
  };

  const handleEndVoiceCall = () => {
    setIsVoiceCallOpen(false);
  };

  const handleStartVideoCall = () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError("Video calls are not supported in this browser.");
      return;
    }
    if (isVoiceCallOpen) setIsVoiceCallOpen(false);
    setVideoCallError("");
    setIsVideoCallOpen(true);
  };

  const handleEndVideoCall = () => {
    setIsVideoCallOpen(false);
  };

  useEffect(() => {
    if (!isVideoCallOpen) return;
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setVideoCallError("Video calls are not supported on this device.");
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
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setIsMicEnabled(true);
        setIsCameraEnabled(true);
        setIsVideoCallConnecting(false);
      })
      .catch(() => {
        if (!cancelled) {
          setVideoCallError(
            "We could not access your camera or microphone. Check your browser permissions."
          );
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
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
    };
  }, [isVideoCallOpen]);

  useEffect(() => {
    if (!isVoiceCallOpen) return;
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setVoiceCallError("Voice calls are not supported on this device.");
      return;
    }
    let cancelled = false;
    setIsVoiceCallConnecting(true);
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        voiceCallStreamRef.current = stream;
        stream.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });
        setIsVoiceMuted(false);
        setVoiceCallDuration(0);
        setIsVoiceCallConnecting(false);
        voiceCallTimerRef.current = setInterval(() => {
          setVoiceCallDuration((prev) => prev + 1);
        }, 1000);
      })
      .catch(() => {
        if (!cancelled) {
          setVoiceCallError(
            "We could not access your microphone. Check your browser permissions."
          );
          setIsVoiceCallConnecting(false);
        }
      });
    return () => {
      cancelled = true;
      setIsVoiceCallConnecting(false);
      if (voiceCallTimerRef.current) {
        clearInterval(voiceCallTimerRef.current);
        voiceCallTimerRef.current = null;
      }
      if (voiceCallStreamRef.current) {
        voiceCallStreamRef.current.getTracks().forEach((track) => track.stop());
        voiceCallStreamRef.current = null;
      }
      setIsVoiceMuted(false);
      setVoiceCallDuration(0);
    };
  }, [isVoiceCallOpen]);

  const toggleVoiceMute = () => {
    const stream = voiceCallStreamRef.current;
    if (!stream) return;
    const nextMuted = !isVoiceMuted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsVoiceMuted(nextMuted);
  };

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
  const hasAttachments = attachments.length > 0;
  const canSend = hasDraft || hasAttachments || Boolean(pendingVoiceNote);

  const emojiButtonClasses = [
    "flex h-11 w-10 items-center justify-center text-[#54656f] transition hover:text-[#111b21]",
    isEmojiPickerOpen ? "text-[#111b21]" : "",
  ].join(" ");

  const voiceMuteButtonClasses = [
    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
    isVoiceMuted
      ? "bg-rose-600/80 hover:bg-rose-600"
      : "bg-white/10 hover:bg-white/20",
  ].join(" ");

  const voiceStatusMessage = voiceCallError
    ? voiceCallError
    : isVoiceCallConnecting
    ? "Connecting to your microphone..."
    : `Call in progress - ${formatDuration(voiceCallDuration)}`;

  if (loading) {
    return (
      <div className="flex w-full max-w-4xl min-h-[60vh] items-center justify-center rounded-[2rem] border border-[#d1d7db] bg-white/90 px-4 text-sm font-semibold text-slate-500 shadow-lg">
        Loading conversation...
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex w-full max-w-4xl min-h-[60vh] flex-col items-center justify-center gap-4 rounded-[2rem] border border-[#d1d7db] bg-white/90 px-4 text-center shadow">
        <p className="max-w-sm text-sm text-slate-600">
          {error || "We couldn't find that conversation."}
        </p>
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
    <div
      className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-[1.5rem] bg-white/95 shadow-[0_20px_55px_-30px_rgba(0,0,0,0.8)] min-h-[60vh] sm:min-h-[70vh] lg:min-h-[78vh]"
      style={conversationFontStyle}
    >
      <div className="flex items-center justify-between border-b border-[#dde1e3] bg-[#f0f2f5] px-4 py-3 text-[#3b4a54] sm:px-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:flex-nowrap">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656f] transition hover:bg-[#e9edef]"
            aria-label="Back to matches"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <img
            src={
              partner?.photoUrls?.[0] ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${partner?.firstName || "Kujuana"}`
            }
            alt={partner?.firstName}
            className="h-11 w-11 rounded-full border border-[#e9edef] object-cover shadow-sm sm:h-12 sm:w-12"
          />
          <div className="min-w-0 leading-tight">
            <h1 className="text-[16px] font-semibold text-[#111b21]">
              {partner ? partner.firstName : "Your match"}
            </h1>
            <div className="flex items-center gap-2 text-xs text-[#667781]">
              <span
                className="inline-flex h-2 w-2 rounded-full bg-[#25d366]"
                aria-hidden="true"
              />
              <span className="capitalize">{statusText}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[#54656f]">
          <button
            type="button"
            onClick={handleStartVideoCall}
            className="rounded-full p-2 text-[#54656f] transition hover:bg-[#e9edef]"
            aria-label="Start video call"
          >
            <VideoCameraIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleStartVoiceCall}
            className="rounded-full p-2 text-[#54656f] transition hover:bg-[#e9edef]"
            aria-label="Start voice call"
          >
            <PhoneIcon className="h-5 w-5" />
          </button>
         {/* <button
            type="button"
            className="rounded-full p-2 text-[#54656f] transition hover:bg-[#e9edef]"
            aria-label="Search conversation"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-full p-2 text-[#54656f] transition hover:bg-[#e9edef]"
            aria-label="More options"
          >
            <EllipsisVerticalIcon className="h-5 w-5" />
          </button>*/}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-5 sm:py-6" style={chatBackgroundStyle}>
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
              const senderLabel = isMine
                ? "You"
                : partner?.firstName || partner?.lastName || "Match";
              const voiceNote =
                message.voiceNote && typeof message.voiceNote === "object"
                  ? message.voiceNote
                  : null;
              const messageAttachments = normalizeAttachmentsForDisplay(
                message.attachments,
                item.id
              );
              const imageAttachments = messageAttachments.filter(
                (attachment) => attachment.kind === "image"
              );
              const otherAttachments = messageAttachments.filter(
                (attachment) => attachment.kind !== "image"
              );
              const textContent =
                typeof message.text === "string" ? message.text : "";
              const hasText = textContent.trim().length > 0;
              return (
                <div key={item.id} className="flex flex-col">
                  <div
                    className={`relative max-w-[85%] break-words rounded-[1.5rem] border px-4 py-3 text-[15px] leading-snug shadow-sm ${
                      isMine
                        ? "ml-auto rounded-br-md border-[#b6deb6] bg-[#d9fdd3] text-[#1f2528]"
                        : "mr-auto rounded-bl-md border-[#ebe9e4] bg-white text-[#1f2c34]"
                    }`}
                  >
                    {isMine ? (
                      <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[#1b73e8]">
                        <span className="inline-flex border-l-4 border-[#1b73e8] pl-2 leading-tight">
                          {senderLabel}
                        </span>
                      </div>
                    ) : null}

                    {imageAttachments.length ? (
                      <div
                        className={`grid gap-2 ${
                          imageAttachments.length > 1
                            ? "grid-cols-2"
                            : "grid-cols-1"
                        } ${voiceNote || hasText || otherAttachments.length ? "mb-2" : ""}`}
                      >
                        {imageAttachments.map((attachment, attachmentIndex) => {
                          const src =
                            attachment?.dataUrl ||
                            attachment?.dataUri ||
                            attachment?.url ||
                            attachment?.data;
                          if (!src) return null;
                          const key =
                            attachment?.id ||
                            attachment?.name ||
                            `${item.id}-attachment-${attachmentIndex}`;
                          return (
                            <img
                              key={key}
                              src={src}
                              alt={attachment?.name || "Shared image"}
                              className="h-40 w-full rounded-xl object-cover"
                              loading="lazy"
                            />
                          );
                        })}
                      </div>
                    ) : null}

                    {otherAttachments.map((attachment, otherIndex) => {
                      if (attachment.kind === "document") {
                        const meta = [formatFileSize(attachment.size), attachment.mimeType]
                          .filter(Boolean)
                          .join(" • ");
                        return (
                          <div
                            key={attachment.id || `${item.id}-document-${otherIndex}`}
                            className="mb-2 rounded-xl border border-[#dfe1dc] bg-white/95 p-3 text-sm text-[#1f2c34] shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f2f5] text-[#5e4891]">
                                <DocumentArrowUpIcon className="h-5 w-5" />
                              </span>
                              <div className="flex-1">
                                <p className="truncate text-[15px] font-semibold">
                                  {attachment.name || "Document"}
                                </p>
                                {meta ? (
                                  <p className="text-xs text-[#6a7175]">{meta}</p>
                                ) : null}
                              </div>
                              <a
                                href={attachment.dataUrl}
                                download={attachment.name || "document"}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-semibold text-[#5e4891] hover:underline"
                              >
                                Download
                              </a>
                            </div>
                          </div>
                        );
                      }
                      if (attachment.kind === "contact") {
                        const contactName =
                          typeof attachment.name === "string"
                            ? attachment.name.trim()
                            : "";
                        const contactPhone =
                          typeof attachment.phone === "string"
                            ? attachment.phone.trim()
                            : "";
                        const contactEmail =
                          typeof attachment.email === "string"
                            ? attachment.email.trim()
                            : "";
                        const contactNote =
                          typeof attachment.note === "string"
                            ? attachment.note.trim()
                            : "";
                        const primaryLabel =
                          contactName ||
                          contactPhone ||
                          contactEmail ||
                          "Shared contact";
                        return (
                          <div
                            key={attachment.id || `${item.id}-contact-${otherIndex}`}
                            className="mb-2 rounded-xl border border-[#dfe1dc] bg-white/95 p-3 text-sm text-[#1f2c34] shadow-sm"
                          >
                            <div className="mb-1 flex items-center gap-2 text-[#5e4891]">
                              <UserIcon className="h-5 w-5" />
                              <span className="font-semibold">{primaryLabel}</span>
                            </div>
                            {contactPhone ? (
                              <p className="text-xs text-[#6a7175]">
                                {contactPhone}
                              </p>
                            ) : null}
                            {contactEmail ? (
                              <p className="text-xs text-[#6a7175]">
                                {contactEmail}
                              </p>
                            ) : null}
                            {contactNote ? (
                              <p className="text-xs text-[#6a7175]">
                                {contactNote}
                              </p>
                            ) : null}
                          </div>
                        );
                      }
                      if (attachment.kind === "location") {
                        return (
                          <div
                            key={attachment.id || `${item.id}-location-${otherIndex}`}
                            className="mb-2 rounded-xl border border-[#dfe1dc] bg-white/95 p-3 text-sm text-[#1f2c34] shadow-sm"
                          >
                            <div className="mb-1 flex items-center gap-2 text-[#5e4891]">
                              <MapPinIcon className="h-5 w-5" />
                              <span className="font-semibold">
                                {attachment.label || "Shared location"}
                              </span>
                            </div>
                            <p className="text-xs text-[#6a7175]">
                              {formatCoordinate(attachment.lat)},{" "}
                              {formatCoordinate(attachment.lng)}
                              {typeof attachment.accuracy === "number"
                                ? ` • ${Math.round(attachment.accuracy)}m`
                                : ""}
                            </p>
                            {attachment.mapUrl ? (
                              <a
                                href={attachment.mapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex text-xs font-semibold text-[#5e4891] hover:underline"
                              >
                                Open in Maps
                              </a>
                            ) : null}
                          </div>
                        );
                      }
                      return null;
                    })}

                    {voiceNote ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <audio
                            controls
                            src={voiceNote.dataUrl}
                            className="max-w-[210px]"
                            preload="metadata"
                          />
                          {voiceNote.duration ? (
                            <span className="text-xs text-[#6a7175]">
                              {formatDuration(voiceNote.duration)}
                            </span>
                          ) : null}
                        </div>
                        {hasText ? (
                          <p className="whitespace-pre-wrap break-words">
                            {textContent}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {!voiceNote && hasText ? (
                      <p className="whitespace-pre-wrap break-words">
                        {textContent}
                      </p>
                    ) : null}

                    <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-[#6a7175]">
                      <span>{formatTime(message.createdAt)}</span>
                      {isMine && (
                        <span
                          className="flex items-center text-[#34b7f1]"
                          aria-label="Delivered"
                        >
                          <CheckIcon className="h-3 w-3" />
                          <CheckIcon className="h-3 w-3 -ml-2" />
                        </span>
                      )}
                    </div>

                    <span
                      className={`absolute bottom-0 ${
                        isMine ? "right-[-6px]" : "left-[-6px]"
                      } h-3 w-3 rotate-45 ${
                        isMine
                          ? "border-b border-r border-[#b6deb6] bg-[#d9fdd3]"
                          : "border-b border-l border-[#ebe9e4] bg-white"
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="mx-auto max-w-sm rounded-2xl border border-[#d1d7db] bg-white/95 p-5 text-center text-sm text-[#5d656a] shadow">
              Break the ice with a thoughtful note. Your conversation history
              stays here.
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="px-4 pb-1 text-sm text-rose-600 sm:px-6">{error}</p>
      )}
      {recordingError && !isRecording && !pendingVoiceNote ? (
        <p className="px-4 text-sm text-rose-600 sm:px-6">{recordingError}</p>
      ) : null}

      {isRecording ? (
        <div className="px-4 sm:px-6">
          <div className="mb-2 flex items-center gap-3 rounded-2xl bg-white px-3 py-2 text-sm text-[#1f2c34] shadow">
            <span
              className="inline-flex h-2 w-2 animate-ping rounded-full bg-rose-500"
              aria-hidden="true"
            />
            <span className="font-medium">
              Recording... {formatDuration(recordingDuration)}
            </span>
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

      {attachments.length ? (
        <div className="px-4 sm:px-6">
          <div className="mb-2 flex flex-wrap gap-3">
            {attachments.map((item) => {
              if (!item) return null;
              if (item.kind === "document") {
                const sizeLabel = formatFileSize(item.size) || "Ready to send";
                return (
                  <div
                    key={item.id}
                    className="relative w-56 rounded-2xl border border-[#d1d7db] bg-white px-3 py-2 text-sm text-[#1f2c34] shadow"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0f2f5] text-[#5e4891]">
                        <DocumentArrowUpIcon className="h-5 w-5" />
                      </span>
                      <div className="flex-1">
                        <p className="truncate font-semibold">
                          {item.name || "Document"}
                        </p>
                        <p className="text-xs text-[#6a7175]">{sizeLabel}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-[#6a7175]">
                      {item.mimeType || "application/octet-stream"}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(item.id)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/80"
                      aria-label="Remove attachment"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                );
              }
              if (item.kind === "contact") {
                const contactName =
                  typeof item.name === "string" ? item.name.trim() : "";
                const contactPhone =
                  typeof item.phone === "string" ? item.phone.trim() : "";
                const contactEmail =
                  typeof item.email === "string" ? item.email.trim() : "";
                const contactNote =
                  typeof item.note === "string" ? item.note.trim() : "";
                const primaryLabel =
                  contactName ||
                  contactPhone ||
                  contactEmail ||
                  "Shared contact";
                return (
                  <div
                    key={item.id}
                    className="relative w-56 rounded-2xl border border-[#d1d7db] bg-white px-3 py-2 text-sm text-[#1f2c34] shadow"
                  >
                    <div className="mb-1 flex items-center gap-2 text-[#5e4891]">
                      <UserIcon className="h-5 w-5" />
                      <span className="font-semibold">{primaryLabel}</span>
                    </div>
                    {contactPhone ? (
                      <p className="text-xs text-[#6a7175]">{contactPhone}</p>
                    ) : null}
                    {contactEmail ? (
                      <p className="text-xs text-[#6a7175]">{contactEmail}</p>
                    ) : null}
                    {contactNote ? (
                      <p className="text-xs text-[#6a7175]">{contactNote}</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(item.id)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/80"
                      aria-label="Remove attachment"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                );
              }
              if (item.kind === "location") {
                return (
                  <div
                    key={item.id}
                    className="relative w-56 rounded-2xl border border-[#d1d7db] bg-white px-3 py-2 text-sm text-[#1f2c34] shadow"
                  >
                    <div className="mb-1 flex items-center gap-2 text-[#5e4891]">
                      <MapPinIcon className="h-5 w-5" />
                      <span className="font-semibold">
                        {item.label || "Shared location"}
                      </span>
                    </div>
                    <p className="text-xs text-[#6a7175]">
                      {formatCoordinate(item.lat)}, {formatCoordinate(item.lng)}
                    </p>
                    {item.mapUrl ? (
                      <a
                        href={item.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex text-xs font-semibold text-[#5e4891] hover:underline"
                      >
                        View map
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(item.id)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/80"
                      aria-label="Remove attachment"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                );
              }
              const previewSrc = item.previewUrl || item.dataUrl;
              if (!previewSrc) return null;
              return (
                <div
                  key={item.id}
                  className="relative h-20 w-20 overflow-hidden rounded-2xl bg-[#f0f2f5] shadow"
                >
                  <img
                    src={previewSrc}
                    alt={item.name || "Shared image"}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(item.id)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                    aria-label="Remove attachment"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {pendingVoiceNote ? (
        <div className="px-4 sm:px-6">
          <div className="mb-2 flex items-center gap-3 rounded-2xl bg-white px-3 py-2 text-sm text-[#5e4891] shadow">
            <audio
              controls
              src={pendingVoiceNote.url}
              className="max-w-[220px]"
              preload="metadata"
            />
            <span className="text-xs text-[#6a7175]">
              {formatDuration(pendingVoiceNote.duration)}
            </span>
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

      <form
        onSubmit={handleSend}
        className="border-t border-[#d1d7db] bg-[#f0f2f5] px-4 py-4 sm:px-5"
      >
        <div className="relative flex items-end gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
          {isEmojiPickerOpen ? (
            <EmojiPicker
              anchorRef={emojiButtonRef}
              onSelect={handleEmojiSelect}
              onClose={() => setIsEmojiPickerOpen(false)}
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
          <div className="relative flex items-center">
            <button
              type="button"
              ref={paperclipButtonRef}
              onClick={handleAttachmentClick}
              className="flex h-10 w-10 items-center justify-center text-[#54656f] transition hover:text-[#111b21]"
              aria-label="Add attachment"
            >
              <PaperClipIcon className="h-6 w-6 rotate-45" />
            </button>
            {isAttachmentMenuOpen ? (
              <div
                ref={attachmentMenuRef}
                className="absolute bottom-full left-1/2 mb-2 w-52 -translate-x-1/2 rounded-2xl border border-[#d1d7db] bg-white p-2 text-sm shadow-xl"
              >
                <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-[#6a7175]">
                  Share
                </p>
                <button
                  type="button"
                  onClick={handleShareContact}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[#1f2c34] transition hover:bg-[#f0f2f5]"
                >
                  <UserPlusIcon className="h-5 w-5 text-[#5e4891]" />
                  Share contact
                </button>
                <button
                  type="button"
                  onClick={handleShareImages}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[#1f2c34] transition hover:bg-[#f0f2f5]"
                >
                  <PhotoIcon className="h-5 w-5 text-[#5e4891]" />
                  Share images
                </button>
                <button
                  type="button"
                  onClick={handleShareLocation}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[#1f2c34] transition hover:bg-[#f0f2f5]"
                >
                  <MapPinIcon className="h-5 w-5 text-[#5e4891]" />
                  Share location
                </button>
                <button
                  type="button"
                  onClick={handleShareDocuments}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[#1f2c34] transition hover:bg-[#f0f2f5]"
                >
                  <DocumentArrowUpIcon className="h-5 w-5 text-[#5e4891]" />
                  Share documents
                </button>
              </div>
            ) : null}
          </div>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder="Type a message"
            rows={1}
            className="max-h-40 mb-2 flex-1 resize-none border-0 bg-transparent text-[15px] text-[#1f2c34] outline-none focus:ring-0"
          />
         { /*<button
            type="button"
            onClick={handleCameraClick}
            className="flex h-10 w-10 items-center justify-center text-[#54656f] transition hover:text-[#111b21]"
            aria-label="Open camera"
          >
            <CameraIcon className="h-6 w-6" />
          </button>*/}
          <input
            ref={attachmentInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleAttachmentChange}
          />
          <input
            ref={documentInputRef}
            type="file"
            accept={DOCUMENT_ACCEPT}
            multiple
            className="hidden"
            onChange={handleDocumentChange}
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
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#40247f] text-white transition hover:bg-[#503889]"
              aria-label="Record voice note"
            >
              <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
            </button>
          )}
        </div>
      </form>

      {isVoiceCallOpen ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative flex w-[90%] max-w-md flex-col items-center gap-6 rounded-[32px] border border-white/15 bg-[#130834] px-8 py-10 text-white shadow-2xl">
            <button
              type="button"
              onClick={handleEndVoiceCall}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 transition hover:bg-white/20"
              aria-label="Close voice call"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#4a3096]/35 text-white">
              <PhoneIcon className="h-10 w-10 -rotate-45" />
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold">
                {partner?.firstName || "Your match"}
              </p>
              <p className="text-sm text-white/70">{voiceStatusMessage}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={toggleVoiceMute}
                className={voiceMuteButtonClasses}
              >
                {isVoiceMuted ? (
                  <NoSymbolIcon className="h-5 w-5" />
                ) : (
                  <MicrophoneIcon className="h-5 w-5" />
                )}
                <span>{isVoiceMuted ? "Unmute mic" : "Mute mic"}</span>
              </button>
              <button
                type="button"
                onClick={handleEndVoiceCall}
                className="flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
              >
                <PhoneIcon className="h-5 w-5 -rotate-45" />
                <span>End call</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${isCameraEnabled ? "" : "opacity-40"}`}
                />
                {!isCameraEnabled ? (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
                    Camera off
                  </div>
                ) : null}
              </div>
              <div className="flex aspect-video items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-center text-sm text-white/70">
                {isVideoCallConnecting
                  ? "Connecting to your camera and microphone..."
                  : `Waiting for ${partner?.firstName || "your match"} to join`}
              </div>
            </div>
            {videoCallError ? (
              <p className="text-sm text-rose-300">{videoCallError}</p>
            ) : null}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={toggleMic}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isMicEnabled
                    ? "bg-white/10 hover:bg-white/20"
                    : "bg-rose-600/80 hover:bg-rose-600"
                }`}
              >
                {isMicEnabled ? (
                  <MicrophoneIcon className="h-5 w-5" />
                ) : (
                  <NoSymbolIcon className="h-5 w-5" />
                )}
                <span>{isMicEnabled ? "Mute mic" : "Unmute mic"}</span>
              </button>
              <button
                type="button"
                onClick={toggleCamera}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isCameraEnabled
                    ? "bg-white/10 hover:bg-white/20"
                    : "bg-amber-500/80 hover:bg-amber-500"
                }`}
              >
                {isCameraEnabled ? (
                  <VideoCameraIcon className="h-5 w-5" />
                ) : (
                  <VideoCameraSlashIcon className="h-5 w-5" />
                )}
                <span>
                  {isCameraEnabled ? "Turn camera off" : "Turn camera on"}
                </span>
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
