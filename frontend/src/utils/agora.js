const sanitizeChannelFragment = (value) => {
  if (!value) return '';
  return value.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
};

export const buildAgoraChannelName = (raw) => {
  const base = sanitizeChannelFragment(raw) || 'kujuana-call';
  return base.slice(0, 60);
};

export const getAgoraAppId = () => import.meta.env.VITE_AGORA_APP_ID || '';

export const requestAgoraToken = async ({ channel, type, matchId }) => {
  const endpoint = import.meta.env.VITE_AGORA_TOKEN_ENDPOINT;
  if (endpoint) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        type,
        matchId,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch Agora token from the configured endpoint.');
    }
    const payload = await response.json();
    if (typeof payload === 'string') {
      return payload;
    }
    return payload.token || payload.data?.token || null;
  }

  const staticToken = import.meta.env.VITE_AGORA_TEMP_TOKEN;
  if (staticToken) {
    return staticToken;
  }

  // When an Agora project is created without an App Certificate, joining without a token is allowed.
  return null;
};

export const AGORA_ENV_HINT =
  'Set VITE_AGORA_APP_ID and either VITE_AGORA_TOKEN_ENDPOINT or VITE_AGORA_TEMP_TOKEN to enable calling.';
