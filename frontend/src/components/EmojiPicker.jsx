import { useEffect, useMemo, useRef } from 'react';

const EMOJI_CODEPOINTS = {
  Smileys: [0x1f600, 0x1f601, 0x1f602, 0x1f923, 0x1f603, 0x1f605, 0x1f60a, 0x1f60d, 0x1f618, 0x1f61c, 0x1f917, 0x1f929],
  Gestures: [0x1f44d, 0x1f64f, 0x1f44f, 0x1f64c, 0x1f91d, 0x1f4aa, 0x1f91e, 0x1f91f, 0x1f44c, 0x1f919, 0x1f44b, 0x270c],
  Hearts: [0x2764, 0x1f9e1, 0x1f49b, 0x1f49a, 0x1f499, 0x1f49c, 0x1f5a4, 0x1f90d, 0x1f496, 0x1f498, 0x1f49d, 0x1f49e],
  Fun: [0x1f389, 0x1f973, 0x1f525, 0x1f31f, 0x1f338, 0x1f340, 0x2600, 0x1f308, 0x1f370, 0x2615, 0x1f3b5, 0x2708],
};

const DEFAULT_EMOJIS = Object.entries(EMOJI_CODEPOINTS).map(([label, codes]) => ({
  label,
  emojis: codes.map((code) => String.fromCodePoint(code)),
}));

const VARIANT_CLASSNAMES = {
  light: {
    container:
      'absolute bottom-full left-0 z-40 mb-3 w-72 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl shadow-slate-600/20 backdrop-blur',
    groupLabel: 'px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500',
    emojiButton:
      'flex items-center justify-center rounded-xl p-2 text-xl transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#4a3096]/40',
  },
  dark: {
    container:
      'absolute bottom-full left-0 z-40 mb-4 w-72 rounded-2xl border border-white/15 bg-white/10 p-3 shadow-[0_30px_55px_rgba(8,2,31,0.45)] backdrop-blur-xl',
    groupLabel: 'px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-white/60',
    emojiButton:
      'flex items-center justify-center rounded-xl p-2 text-xl text-white/90 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40',
  },
};

const EmojiPicker = ({ onSelect, onClose, anchorRef, variant = 'light', emojis = DEFAULT_EMOJIS }) => {
  const containerRef = useRef(null);

  const classNames = useMemo(() => VARIANT_CLASSNAMES[variant] || VARIANT_CLASSNAMES.light, [variant]);

  useEffect(() => {
    if (!onClose) return undefined;

    const handlePointerDown = (event) => {
      const container = containerRef.current;
      if (!container) return;
      if (container.contains(event.target)) return;
      if (anchorRef?.current && anchorRef.current.contains(event.target)) return;
      onClose();
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [anchorRef, onClose]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const firstButton = container.querySelector('button');
    if (firstButton) {
      firstButton.focus();
    }
  }, []);

  return (
    <div ref={containerRef} className={classNames.container} role="dialog" aria-label="Emoji picker">
      <div className="space-y-3">
        {emojis.map((group) => (
          <div key={group.label}>
            <p className={classNames.groupLabel}>{group.label}</p>
            <div className="grid grid-cols-6 gap-1.5">
              {group.emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onSelect?.(emoji)}
                  className={classNames.emojiButton}
                >
                  <span className="leading-none">{emoji}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
