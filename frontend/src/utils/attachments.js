const DOCUMENT_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/rtf,text/rtf';

const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/rtf',
  'text/rtf',
];

const DOCUMENT_EXTENSION_MIME_MAP = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  rtf: 'application/rtf',
};

export const MAX_ATTACHMENTS = 6;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_ACCEPT_STRING = DOCUMENT_ACCEPT;

export const formatFileSize = (bytes) => {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const normalizeExtension = (name = '') => {
  const match = /\.([a-z0-9]+)$/i.exec(name.trim().toLowerCase());
  return match ? match[1] : '';
};

export const inferDocumentMimeTypeFromName = (name = '') => {
  const ext = normalizeExtension(name);
  return DOCUMENT_EXTENSION_MIME_MAP[ext] || '';
};

export const isDocumentMimeType = (mimeType = '') => DOCUMENT_MIME_TYPES.includes(mimeType.trim().toLowerCase());

export const resolveDocumentMimeType = (input) => {
  if (!input) return '';
  if (typeof input === 'string') {
    if (isDocumentMimeType(input)) {
      return input;
    }
    return inferDocumentMimeTypeFromName(input);
  }
  const { type, name } = input;
  if (type && isDocumentMimeType(type)) {
    return type;
  }
  if (typeof name === 'string' && name) {
    return inferDocumentMimeTypeFromName(name);
  }
  return '';
};

export const isAllowedDocumentFile = (file) => {
  if (!file) return false;
  if (typeof file.type === 'string' && isDocumentMimeType(file.type)) {
    return true;
  }
  if (typeof file.name === 'string') {
    return Boolean(inferDocumentMimeTypeFromName(file.name));
  }
  return false;
};

export const buildMapUrl = (lat, lng) => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return '';
  }
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');

export const normalizeAttachmentForDisplay = (attachment, fallbackIdPrefix = 'attachment') => {
  if (!attachment || typeof attachment !== 'object') {
    return null;
  }

  const baseId =
    typeof attachment.id === 'string' && attachment.id
      ? attachment.id
      : `${fallbackIdPrefix}-${Math.random().toString(36).slice(2, 8)}`;

  const rawKind = typeof attachment.kind === 'string' ? attachment.kind.toLowerCase() : '';
  const lat = toNumber(attachment.lat ?? attachment.latitude);
  const lng = toNumber(attachment.lng ?? attachment.longitude);
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);

  if (rawKind === 'location' || hasCoordinates) {
    if (!hasCoordinates) {
      return null;
    }
    const accuracy = toNumber(attachment.accuracy);
    const label =
      typeof attachment.label === 'string' && attachment.label.trim() ? attachment.label.trim() : 'Shared location';
    const mapUrl =
      typeof attachment.mapUrl === 'string' && attachment.mapUrl.startsWith('http')
        ? attachment.mapUrl
        : buildMapUrl(lat, lng);

    return {
      id: baseId,
      kind: 'location',
      lat,
      lng,
      label,
      mapUrl,
      accuracy: typeof accuracy === 'number' ? accuracy : undefined,
    };
  }

  if (rawKind === 'contact') {
    const name = cleanText(attachment.name);
    const phone =
      cleanText(attachment.phone) ||
      cleanText(attachment.phoneNumber) ||
      cleanText(attachment.number);
    const email = cleanText(attachment.email) || cleanText(attachment.emailAddress);
    const note = cleanText(attachment.note) || cleanText(attachment.notes) || cleanText(attachment.description);

    if (!name && !phone && !email && !note) {
      return null;
    }

    return {
      id: baseId,
      kind: 'contact',
      name: name || undefined,
      phone: phone || undefined,
      email: email || undefined,
      note: note || undefined,
    };
  }

  const dataUrl = attachment.dataUrl || attachment.dataUri || attachment.url || attachment.data;
  if (typeof dataUrl !== 'string' || !dataUrl) {
    return null;
  }

  const name = typeof attachment.name === 'string' && attachment.name.trim() ? attachment.name.trim() : '';
  const mimeType = typeof attachment.mimeType === 'string' ? attachment.mimeType : '';
  const size = toNumber(attachment.size);
  const width = toNumber(attachment.width);
  const height = toNumber(attachment.height);

  const isDocument =
    rawKind === 'document' || isDocumentMimeType(mimeType) || (!mimeType && Boolean(inferDocumentMimeTypeFromName(name)));

  if (isDocument) {
    const resolvedMime = mimeType || inferDocumentMimeTypeFromName(name) || 'application/octet-stream';
    return {
      id: baseId,
      kind: 'document',
      name: name || 'Document',
      mimeType: resolvedMime,
      dataUrl,
      size,
    };
  }

  return {
    id: baseId,
    kind: 'image',
    name: name || 'Shared image',
    mimeType: mimeType || 'image/*',
    dataUrl,
    size,
    width,
    height,
  };
};

export const normalizeAttachmentsForDisplay = (attachments, fallbackIdPrefix = 'attachment') => {
  if (!Array.isArray(attachments) || !attachments.length) {
    return [];
  }

  return attachments
    .map((attachment, index) => normalizeAttachmentForDisplay(attachment, `${fallbackIdPrefix}-${index}`))
    .filter(Boolean);
};
