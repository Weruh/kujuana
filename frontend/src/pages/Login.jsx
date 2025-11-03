import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TextInput from '../components/TextInput.jsx';
import { useAuthStore } from '../store/auth.js';
import Logo from '../components/Logo.jsx';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const login = useAuthStore((state) => state.login);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await login(form);
      await fetchProfile();
      navigate('/discover');
    } catch {
      // errors handled by store
    }
  };

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-10 lg:flex-row">
        <div className="flex flex-1 flex-col justify-between">
          <Logo />
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold text-slate-900">Welcome back.</h1>
            <p className="text-lg text-slate-600">
              Continue connecting with intentional singles and building a partnership that honours your values.
            </p>
            <div className="flex flex-col gap-2 text-sm text-slate-600">
              <p>- 100 percent real profiles manually reviewed</p>
              <p>- Cross-continent discovery for diasporans</p>
              <p>- Designed for serious dating and marriage</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} Kujuana</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-6 rounded-3xl bg-white p-8 shadow-xl"
        >
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Log in</h2>
            <p className="text-sm text-slate-500">Not a member yet?{' '}
              <Link to="/register" className="font-semibold text-brand-dark hover:underline">
                Join Kujuana
              </Link>
            </p>
          </div>
          <TextInput
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleChange}
          />
          <TextInput
            name="password"
            type="password"
            label="Password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={handleChange}
          />
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow hover:bg-brand-dark/90 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Enter Kujuana'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;



