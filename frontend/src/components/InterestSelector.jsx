import { useMemo } from 'react';
import clsx from 'clsx';

const COMMON_INTERESTS = [
  'Entrepreneurship',
  'Faith',
  'Family building',
  'Travel',
  'Community service',
  'Wellness',
  'Creative arts',
  'Culinary adventures',
  'Books & Learning',
  'Outdoor retreats',
  'Legacy planning',
  'Fitness',
  'Tech & Innovation',
  'Music',
];

const InterestSelector = ({ value = [], onChange }) => {
  const selectedSet = useMemo(() => new Set(value), [value]);

  const toggle = (interest) => {
    const next = new Set(selectedSet);
    if (next.has(interest)) {
      next.delete(interest);
    } else {
      next.add(interest);
    }
    onChange(Array.from(next));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {COMMON_INTERESTS.map((interest) => {
        const selected = selectedSet.has(interest);
        return (
          <button
            type="button"
            key={interest}
            onClick={() => toggle(interest)}
            className={clsx(
              'rounded-full border px-4 py-2 text-sm font-medium transition',
              selected
                ? 'border-brand-dark bg-brand-dark text-white shadow-md'
                : 'border-slate-200 bg-white text-slate-700 hover:border-brand-dark hover:text-brand-dark',
            )}
          >
            {interest}
          </button>
        );
      })}
    </div>
  );
};

export default InterestSelector;



