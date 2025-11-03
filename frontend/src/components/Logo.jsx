const Logo = ({ className = '' }) => (
  <div className={`flex items-center gap-2 text-brand-dark ${className}`}>
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-dark text-white font-semibold">
      K
    </span>
    <div>
      <p className="text-lg font-semibold leading-none text-slate-900">Kujuana</p>
      <p className="text-xs uppercase tracking-wider text-slate-500">Dating with Intention</p>
    </div>
  </div>
);

export default Logo;


