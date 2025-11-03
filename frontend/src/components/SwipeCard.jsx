import { useEffect, useRef, useState } from 'react';
import { ChatBubbleOvalLeftIcon, HeartIcon, StarIcon } from '@heroicons/react/24/solid';
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SwipeCard = ({ profile, onLike, onPass, onSuperLike, onMessage, onPrevProfile, onNextProfile }) => {
  const fallbackPhoto = `https://api.dicebear.com/7.x/initials/svg?seed=${profile.firstName || 'Kujuana'}`;
  const photos = (profile.photoUrls?.length ? profile.photoUrls : [fallbackPhoto]).filter(Boolean);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showLikeBurst, setShowLikeBurst] = useState(false);
  const likeBurstTimeout = useRef(null);
  const likeBurstFrame = useRef(null);

  useEffect(() => {
    setPhotoIndex(0);
    setShowLikeBurst(false);
    if (likeBurstTimeout.current) {
      clearTimeout(likeBurstTimeout.current);
      likeBurstTimeout.current = null;
    }
    if (likeBurstFrame.current) {
      cancelAnimationFrame(likeBurstFrame.current);
      likeBurstFrame.current = null;
    }
  }, [profile?.id]);

  useEffect(
    () => () => {
      if (likeBurstTimeout.current) {
        clearTimeout(likeBurstTimeout.current);
      }
      if (likeBurstFrame.current) {
        cancelAnimationFrame(likeBurstFrame.current);
      }
    },
    [],
  );

  const photoUrl = photos[photoIndex] || fallbackPhoto;
  const locationLabel = [profile.location?.city, profile.location?.country].filter(Boolean).join(', ');
  const canCyclePhotos = photos.length > 1;

  const goPrevPhoto = () => {
    if (!canCyclePhotos) return;
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goNextPhoto = () => {
    if (!canCyclePhotos) return;
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const handleCardTap = (event) => {
    if (!onPrevProfile && !onNextProfile) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clientX = event.clientX ?? event.nativeEvent?.clientX;

    if (typeof clientX !== 'number' || Number.isNaN(clientX)) return;

    const relativeX = clientX - rect.left;
    if (relativeX < rect.width / 2) {
      onPrevProfile?.();
    } else {
      onNextProfile?.();
    }
  };

  const handlePrevPhotoClick = (event) => {
    event.stopPropagation();
    goPrevPhoto();
  };

  const handleNextPhotoClick = (event) => {
    event.stopPropagation();
    goNextPhoto();
  };

  const triggerLikeBurst = () => {
    if (likeBurstTimeout.current) {
      clearTimeout(likeBurstTimeout.current);
      likeBurstTimeout.current = null;
    }
    if (likeBurstFrame.current) {
      cancelAnimationFrame(likeBurstFrame.current);
      likeBurstFrame.current = null;
    }
    setShowLikeBurst(false);
    likeBurstFrame.current = requestAnimationFrame(() => {
      setShowLikeBurst(true);
      likeBurstTimeout.current = setTimeout(() => {
        setShowLikeBurst(false);
        likeBurstTimeout.current = null;
      }, 600);
    });
  };

  const handleLikeClick = () => {
    triggerLikeBurst();
    if (onLike) {
      onLike();
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 sm:max-w-md">
      <div onClick={handleCardTap} className="relative aspect-[3/4] w-full overflow-hidden rounded-[40px] shadow-[0_28px_60px_-35px_rgba(15,23,42,0.85)]">
        <img src={photoUrl} alt={profile.firstName} className="h-full w-full object-cover" />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div
          className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center transition duration-500 ease-out ${
            showLikeBurst ? 'scale-110 opacity-100' : 'scale-50 opacity-0'
          }`}
        >
          <HeartIcon className="h-24 w-24 text-rose-500 drop-shadow-[0_15px_25px_rgba(244,63,94,0.5)]" />
        </div>
        <div className="absolute inset-0 z-30 flex flex-col justify-between">
          {canCyclePhotos && (
            <>
              <button
                type="button"
                onClick={handlePrevPhotoClick}
                className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-black/35 p-2 text-white transition hover:bg-black/50 focus-visible:outline-none"
                aria-label="Previous photo"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={handleNextPhotoClick}
                className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-black/35 p-2 text-white transition hover:bg-black/50 focus-visible:outline-none"
                aria-label="Next photo"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
              <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-1">
                {photos.map((_, index) => (
                  <span
                    key={`${profile.id || 'profile'}-${index}`}
                    className={`h-1.5 w-6 rounded-full transition ${index === photoIndex ? 'bg-white' : 'bg-white/30'}`}
                  />
                ))}
              </div>
            </>
          )}
          <div className="flex items-start justify-between px-6 pt-6">
            <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90 backdrop-blur">
              {profile.goal || 'Serious relationship'}
            </span>
            {profile.distance && (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur">
                {profile.distance}
              </span>
            )}
          </div>
          <div className="space-y-3 px-6 pb-8 text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
            <div className="flex items-end gap-2">
              <h2 className="text-4xl font-semibold tracking-tight">{profile.firstName}</h2>
              {profile.age && <span className="text-3xl font-light">{profile.age}</span>}
            </div>
            {locationLabel && (
              <p className="flex items-center gap-2 text-sm font-medium text-white/85">
                <MapPinIcon className="h-4 w-4" />
                <span>{locationLabel}</span>
              </p>
            )}
            <p className="text-sm leading-relaxed text-white/90">
              {profile.bio || 'Intentional, grounded and ready to build a meaningful partnership.'}
            </p>
            {!!(profile.interests || []).length && (
              <div className="flex flex-wrap gap-2">
                {(profile.interests || []).slice(0, 4).map((interest) => (
                  <span key={interest} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-6">
        <button
          type="button"
          onClick={onPass}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-rose-500 shadow-[0_12px_30px_-15px_rgba(244,63,94,0.85)] transition hover:scale-105 focus-visible:scale-105 focus-visible:outline-none"
          aria-label="Pass"
        >
          <XMarkIcon className="h-8 w-8" />
        </button>
        {onMessage && (
          <button
            type="button"
            onClick={onMessage}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-dark shadow-[0_12px_30px_-15px_rgba(59,130,246,0.85)] transition hover:scale-105 focus-visible:scale-105 focus-visible:outline-none"
            aria-label="Message match"
          >
            <ChatBubbleOvalLeftIcon className="h-8 w-8" />
          </button>
        )}
        <button
          type="button"
          onClick={handleLikeClick}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 via-orange-400 to-amber-400 text-white shadow-[0_20px_35px_-18px_rgba(249,115,22,0.9)] transition hover:scale-105 focus-visible:scale-105 focus-visible:outline-none"
          aria-label="Like"
        >
          <HeartIcon className="h-9 w-9" />
        </button>
        <button
          type="button"
          onClick={onSuperLike}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-sky-500 shadow-[0_12px_30px_-15px_rgba(14,165,233,0.85)] transition hover:scale-105 focus-visible:scale-105 focus-visible:outline-none"
          aria-label="Super like"
        >
          <StarIcon className="h-8 w-8" />
        </button>
      </div>
    </div>
  );
};

export default SwipeCard;
