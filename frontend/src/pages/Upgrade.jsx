import { useEffect, useState } from 'react';
import { useAuthStore, api } from '../store/auth.js';

const paymentChannels = [
  //{ id: 'stripe', label: 'Stripe (Diaspora)' },
  { id: 'paystack', label: 'Mpesa / Paystack (Africa)' },
];

const Upgrade = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [channel, setChannel] = useState('paystack');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/payments/plans');
        setPlans(data.data);
        setSelectedPlan(data.data.find((plan) => plan.id !== 'free')?.id || null);
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, []);

  const handleUpgrade = async () => {
    if (!token) {
      setMessage('Log in to activate a membership.');
      return;
    }
    if (!selectedPlan) return;
    setLoading(true);
    setMessage('');
    try {
      const { data } = await api.post('/payments/checkout', {
        planId: selectedPlan,
        channel,
      });
      if (data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        setMessage(data.data.message || 'Plan activated.');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not start checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Membership plans</h1>
        <p className="mt-3 text-sm text-slate-600">
          Kujuana is free to join. Unlock more purposeful introductions, incognito mode, and personalised coaching with an upgrade.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <button
              type="button"
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`flex h-full flex-col rounded-3xl border bg-white p-6 text-left shadow transition ${
                isSelected ? 'border-brand-dark ring-2 ring-brand-dark/40' : 'border-slate-200 hover:border-brand-dark/60'
              }`}
            >
              <div className="mb-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-dark">{plan.name}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                </p>
                {plan.billing && (
                  <p className="text-xs uppercase text-slate-500">{plan.billing}</p>
                )}
              </div>
              <ul className="flex flex-1 flex-col gap-2 text-xs text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature}>- {feature}</li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-slate-500">
                {user?.plan === plan.id ? 'Current plan' : isSelected ? 'Selected' : 'Select to upgrade'}
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-800">Preferred payment channel</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {paymentChannels.map((method) => (
            <button
              type="button"
              key={method.id}
              onClick={() => setChannel(method.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                channel === method.id ? 'bg-brand-dark text-white' : 'bg-slate-100 text-slate-600 hover:bg-brand/10 hover:text-brand-dark'
              }`}
            >
              {method.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          We support M-Pesa via Paystack for East & West Africa, and  for diaspora members.
        </p>
        {message && <p className="mt-3 rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand-dark">{message}</p>}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={loading || !selectedPlan}
            className="rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-brand-dark/90 disabled:opacity-50"
          >
            {loading ? 'Redirecting...' : 'Upgrade now'}
          </button>
          <p className="text-xs text-slate-500">
            {token ? 'Stay accountable to your intentions.' : 'You need an account to upgrade.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;





