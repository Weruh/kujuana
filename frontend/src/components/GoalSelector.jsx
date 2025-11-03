const GOALS = [
  'Marriage within 12-24 months',
  'Partnership leading to family',
  'Blended family alignment',
  'Faith-centered relationship',
  'Building together in business',
  'Relocating within Africa',
  'Relocating to the diaspora',
];

const GoalSelector = ({ value = [], onChange }) => {
  const toggle = (goal) => {
    if (value.includes(goal)) {
      onChange(value.filter((item) => item !== goal));
    } else {
      onChange([...value, goal]);
    }
  };

  return (
    <div className="grid gap-2">
      {GOALS.map((goal) => (
        <label
          key={goal}
          className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 hover:border-brand-dark hover:bg-brand/5"
        >
          <input
            type="checkbox"
            checked={value.includes(goal)}
            onChange={() => toggle(goal)}
            className="rounded border-slate-300 text-brand-dark focus:ring-brand-dark/40"
          />
          {goal}
        </label>
      ))}
    </div>
  );
};

export default GoalSelector;



