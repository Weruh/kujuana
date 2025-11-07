import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TextInput from '../components/TextInput.jsx';
import SelectInput from '../components/SelectInput.jsx';
import InterestSelector from '../components/InterestSelector.jsx';
import GoalSelector from '../components/GoalSelector.jsx';
import { useAuthStore } from '../store/auth.js';
import Logo from '../components/Logo.jsx';

const genderOptions = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
];

const Register = () => {
  const [step, setStep] = useState(1);
  const [interests, setInterests] = useState([]);
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState(null);
  const register = useAuthStore((state) => state.register);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const loading = useAuthStore((state) => state.loading);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    age: 28,
    gender: 'female',
    occupation: '',
    bio: '',
    locationCity: '',
    locationCountry: '',
    preferencesGender: 'male',
    preferencesAgeMin: 27,
    preferencesAgeMax: 45,
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (interests.length < 3) {
      setError('Pick at least three interests so we can make thoughtful introductions.');
      return;
    }
    try {
      setError(null);
      const payload = {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        age: Number(form.age),
        gender: form.gender,
        occupation: form.occupation,
        bio: form.bio,
        location: {
          city: form.locationCity,
          country: form.locationCountry,
        },
        interests,
        goals,
        preferences: {
          gender: form.preferencesGender,
          ageRange: [Number(form.preferencesAgeMin), Number(form.preferencesAgeMax)],
        },
      };

      await register(payload);
      await fetchProfile();
      navigate('/discover');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-10">
        <Logo />
        <form onSubmit={handleSubmit} className="grid gap-10">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <h1 className="text-3xl font-semibold text-slate-900">
                Welcome to Kujuana.
              </h1>
              <p className="mt-2 text-lg text-slate-600">
                We champion serious, values-aligned dating for Africans ready to build a legacy together.
              </p>
            </div>
            <div className="rounded-3xl bg-white p-6 text-sm text-slate-500 shadow">
              <p className="font-semibold text-slate-700">How it works</p>
              <ul className="mt-3 space-y-2">
                <li>1. Share who you are and what you value.</li>
                <li>2. We recommend profiles aligned with your goals.</li>
                <li>3. Connect, meet, and stay accountable to your intentions.</li>
              </ul>
            </div>
          </div>

          {step === 1 && (
            <div className="grid gap-6 rounded-3xl bg-white p-8 shadow-xl md:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-800">Your basics</h2>
                <TextInput
                  name="firstName"
                  label="First name"
                  required
                  value={form.firstName}
                  onChange={handleChange}
                />
                <TextInput
                  name="lastName"
                  label="Last name"
                  value={form.lastName}
                  onChange={handleChange}
                />
                <TextInput
                  name="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                />
                <TextInput
                  name="password"
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-4">
                <TextInput
                  name="age"
                  label="Age"
                  type="number"
                  min={25}
                  max={65}
                  required
                  value={form.age}
                  onChange={handleChange}
                />
                <SelectInput
                  name="gender"
                  label="Gender"
                  value={form.gender}
                  onChange={handleChange}
                  options={genderOptions}
                />
                <TextInput
                  name="occupation"
                  label="Occupation"
                  placeholder="Entrepreneur, Consultant, Medical Doctor..."
                  value={form.occupation}
                  onChange={handleChange}
                />
                <div className="flex gap-4">
                  <TextInput
                    name="locationCity"
                    label="City"
                    value={form.locationCity}
                    onChange={handleChange}
                    required
                  />
                  <TextInput
                    name="locationCountry"
                    label="Country"
                    value={form.locationCountry}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow hover:bg-brand-dark/90"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-6 rounded-3xl bg-white p-8 shadow-xl">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-slate-800">Your story</h2>
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    <span className="font-semibold">Bio</span>
                    <textarea
                      name="bio"
                      rows={5}
                      value={form.bio}
                      onChange={handleChange}
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-dark/20"
                      placeholder="Share the legacy you want to build, your values, what matters most."
                    />
                  </label>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Interests</p>
                    <p className="text-xs text-slate-500 mb-3">We use this to surface people you will genuinely connect with.</p>
                    <InterestSelector value={interests} onChange={setInterests} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-slate-800">Your intentions</h2>
                  <GoalSelector value={goals} onChange={setGoals} />
                  <div className="rounded-2xl bg-sand-100 p-4 text-xs text-slate-600">
                    <p className="font-semibold text-slate-700">Kujuana Pledge</p>
                    <p className="mt-2">
                      We uphold a respectful, purpose-driven community. Profiles misaligned with serious dating or displaying
                      nudity/irrelevance are removed. Let us build with honour.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="rounded-full border border-brand-dark px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-dark hover:bg-brand/5"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow hover:bg-brand-dark/90"
                >
                  Preferences
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-6 rounded-3xl bg-white p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-slate-800">Match preferences</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <SelectInput
                  name="preferencesGender"
                  label="Looking to meet"
                  value={form.preferencesGender}
                  onChange={handleChange}
                  options={[
                    { value: 'male', label: 'Men' },
                    { value: 'female', label: 'Women' },
                  ]}
                />
                <div className="grid gap-2 text-sm text-slate-700">
                  <span className="font-semibold">Preferred age range</span>
                  <div className="flex items-center gap-3">
                    <TextInput
                      name="preferencesAgeMin"
                      type="number"
                      min={20}
                      max={60}
                      value={form.preferencesAgeMin}
                      onChange={handleChange}
                    />
                    <span>to</span>
                    <TextInput
                      name="preferencesAgeMax"
                      type="number"
                      min={20}
                      max={70}
                      value={form.preferencesAgeMax}
                      onChange={handleChange}
                    />
                  </div>
                  <span className="text-xs text-slate-500">Refine this anytime from your profile.</span>
                </div>
              </div>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="rounded-full border border-brand-dark px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-dark hover:bg-brand/5"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow hover:bg-brand-dark/90 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Launch Kujuana'}
                </button>
              </div>
              <p className="text-center text-xs text-slate-500">
                By joining you agree to keep Kujuana mature, respectful, and free from explicit or irrelevant content.
              </p>
            </div>
          )}
        </form>
      </div>
      <p className="py-6 text-center text-xs text-slate-500">
        Already intentional?{' '}
        <Link to="/login" className="font-semibold text-brand-dark hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default Register;





