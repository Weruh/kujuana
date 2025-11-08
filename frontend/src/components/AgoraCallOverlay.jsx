import { useEffect, useRef, useState } from 'react';
import { XMarkIcon, SpeakerWaveIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { MicrophoneIcon } from '@heroicons/react/24/solid';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { getAgoraAppId, requestAgoraToken } from '../utils/agora.js';

const statusLabels = {
  preparing: 'Preparing devices�',
  token: 'Requesting secure token�',
  joining: 'Connecting to Agora�',
  publishing: 'Publishing your stream�',
  live: 'You are live',
  waiting: 'Waiting for the other person to join�',
  error: 'Unable to connect',
};

const AgoraCallOverlay = ({ type, channel, partnerName, matchId, onClose, onError }) => {
  const clientRef = useRef(null);
  const localTracksRef = useRef([]);
  const remoteVideoRef = useRef(null);
  const remoteVideoTrackRef = useRef(null);
  const localVideoRef = useRef(null);
  const [status, setStatus] = useState('preparing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;
    let subscribedVideoUser = null;

    const cleanupTracks = () => {
      localTracksRef.current.forEach((track) => {
        track.stop();
        track.close();
      });
      localTracksRef.current = [];
    };

    const handleError = (message, rawError) => {
      console.error(message, rawError);
      setError(message);
      setStatus('error');
      onError?.(message);
    };

    const start = async () => {
      try {
        const appId = getAgoraAppId();
        if (!appId) {
          throw new Error('Missing VITE_AGORA_APP_ID environment variable.');
        }
        setStatus('token');
        const token = await requestAgoraToken({ channel, type, matchId });
        setStatus('joining');
        await client.join(appId, channel, token || null, null);
        setStatus('publishing');

        if (type === 'video') {
          const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          localTracksRef.current = [micTrack, camTrack];
          camTrack.play(localVideoRef.current);
          await client.publish([micTrack, camTrack]);
        } else {
          const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
          localTracksRef.current = [micTrack];
          await client.publish(micTrack);
        }
        setStatus('waiting');
      } catch (err) {
        handleError(err.message || 'Unable to start Agora call.', err);
      }
    };

    const handleUserPublished = async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') {
          if (remoteVideoTrackRef.current && remoteVideoTrackRef.current !== user.videoTrack) {
            remoteVideoTrackRef.current.stop();
          }
          user.videoTrack?.play(remoteVideoRef.current);
          remoteVideoTrackRef.current = user.videoTrack;
          subscribedVideoUser = user.uid;
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
        setStatus('live');
      } catch (err) {
        handleError('Failed to subscribe to remote stream.', err);
      }
    };

    const handleUserUnpublished = (user, mediaType) => {
      if (mediaType === 'video' && user.uid === subscribedVideoUser) {
        user.videoTrack?.stop();
        remoteVideoTrackRef.current = null;
        subscribedVideoUser = null;
        setStatus('waiting');
      }
    };

    start();
    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);
    client.on('user-left', () => setStatus('waiting'));

    return () => {
      client.off('user-published', handleUserPublished);
      client.off('user-unpublished', handleUserUnpublished);
      client.removeAllListeners();
      cleanupTracks();
      client.leave().catch((leaveError) => console.error('Agora client leave failed', leaveError));
    };
  }, [channel, matchId, onError, type]);

  const statusMessage = error || statusLabels[status] || 'Connecting�';
  const isVideo = type === 'video';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-8 text-white">
      <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-[34px] bg-[#0b141a] shadow-[0_45px_120px_rgba(0,0,0,0.55)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/10 p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
          aria-label="Close call"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        <header className="flex flex-col gap-1 px-8 pb-6 pt-8">
          <p className="text-lg font-semibold">{partnerName || 'Your match'}</p>
          <p className="text-sm text-white/70">Agora {isVideo ? 'video' : 'voice'} call</p>
        </header>
        <div className="flex flex-1 flex-col gap-6 px-8 pb-8">
          <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/5 bg-[#111b21]">
            {isVideo ? (
              <div className="relative h-full w-full">
                <div ref={remoteVideoRef} className="h-full w-full bg-[#111b21]" />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm uppercase tracking-[0.3em] text-white/30">
                  {status === 'waiting' ? 'Waiting for participant�' : ''}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 text-xs font-medium text-white/80">
                  {statusMessage}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-white/80">
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-white/5">
                  <SpeakerWaveIcon className="h-12 w-12" />
                </span>
                <p className="text-base font-medium">{statusMessage}</p>
                <p className="text-sm text-white/60">Microphone is live. Audio will connect as soon as the other person joins.</p>
              </div>
            )}
            {isVideo ? (
              <div className="absolute bottom-6 right-6 flex w-40 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1f2c34]/90 shadow-lg">
                <div className="bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/60">You</div>
                <div ref={localVideoRef} className="h-32 w-full bg-black/60" />
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Status</p>
              <p className="text-base font-semibold text-white">
                {error ? 'Disconnected' : status === 'live' ? 'Live' : 'Connecting'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white/10 p-3">
                {isVideo ? <VideoCameraIcon className="h-6 w-6" /> : <MicrophoneIcon className="h-6 w-6" />}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-[#f15c6d] px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-[#d94c5c]"
              >
                Hang up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgoraCallOverlay;
