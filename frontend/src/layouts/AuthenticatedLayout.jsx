import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileNavOpen(false);
    navigate('/');
  };

  const avatarUrl = user?.photoUrls?.[0];
  const avatarInitial = (user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase();

  const closeMobileNav = () => setMobileNavOpen(false);

  const mobileNavLinkClasses = (isActive) =>
    `rounded-2xl px-3 py-3 text-sm font-semibold transition ${
      isActive ? 'bg-brand/10 text-brand-dark' : 'text-slate-600 hover:bg-brand/10 hover:text-brand-dark'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6eeff] via-[#f1e6ff] to-[#f9f2ff]">
      <header className="bg-white/80 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-dark/40 text-brand-dark transition hover:bg-brand/10 md:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            {user && (
              <div className="hidden items-center gap-3 md:flex">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full  text-sm font-semibold uppercase text-brand-dark">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`${user.firstName || 'Kujuana'} avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    avatarInitial
                  )}
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-slate-900">{user.firstName}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {user.plan?.replace('-', ' ') || 'Free'}
                  </p>
                </div>
              </div>
            )}
            {/*<button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-brand-dark/60 px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white"
            >
              Log out
              </button>*/}
          </div>
        </div>
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <button
              type="button"
              className="h-full flex-1 bg-slate-900/40 backdrop-blur-sm"
              aria-label="Close navigation menu"
              onClick={closeMobileNav}
            />
            <div className="relative flex h-full w-72 max-w-[80vw] flex-col bg-white px-5 py-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <Logo />
                <button
                  type="button"
                  onClick={closeMobileNav}
                  className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                  aria-label="Close menu"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              {user && (
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-brand/10 text-base font-semibold uppercase text-brand-dark">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={`${user.firstName || 'Kujuana'} avatar`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      avatarInitial
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{user.firstName}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      {user.plan?.replace('-', ' ') || 'Free'}
                    </p>
                  </div>
                </div>
              )}
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMobileNav}
                    className={({ isActive }) => mobileNavLinkClasses(isActive)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-full border border-brand-dark/40 px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand/10"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-10 sm:px-6 sm:py-12">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthenticatedLayout;

