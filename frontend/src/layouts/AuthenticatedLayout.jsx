import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.js';
import Logo from '../components/Logo.jsx';

const navItems = [
  { to: '/discover', label: 'Discover' },
  { to: '/matches', label: 'Matches' },
  { to: '/profile', label: 'Profile' },
  { to: '/upgrade', label: 'Upgrade' },
];

const AuthenticatedLayout = () => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6eeff] via-[#f1e6ff] to-[#f9f2ff]">
      <header className="bg-white/80 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 sm:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? 'border-b-2 border-brand-dark pb-1 text-brand-dark' : 'hover:text-brand-dark'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden text-right text-sm sm:block">
                <p className="font-semibold text-slate-900">{user.firstName}</p>
                <p className="text-xs uppercase tracking-wide text-slate-400">{user.plan?.replace('-', ' ') || 'Free'}</p>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-brand-dark/60 px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthenticatedLayout;


