const SelectInput = ({ label, options = [], helper, error, ...props }) => (
  <label className="flex flex-col gap-1 text-sm text-slate-700">
    <span className="font-semibold">{label}</span>
    <select
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-dark/20"
      {...props}
    >
      <option value="" disabled>
        Select...
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {helper && <span className="text-xs text-slate-500">{helper}</span>}
    {error && <span className="text-xs text-red-500">{error}</span>}
  </label>
);

export default SelectInput;


