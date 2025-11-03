import { useEffect, useState } from 'react';
import dayjs from '../utils/dayjs.js';
import TextInput from '../components/TextInput.jsx';
import InterestSelector from '../components/InterestSelector.jsx';
import GoalSelector from '../components/GoalSelector.jsx';
import SelectInput from '../components/SelectInput.jsx';
import { useAuthStore, api } from '../store/auth.js';

const Profile = () => {
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await fetchProfile();
      setProfile(data);
    };
    load();
  }, [fetchProfile]);

  if (!profile) {
    return <p className="text-sm text-slate-500">Loading profile...</p>;
  }

  const handleChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (parent, field, value) => {
    setProfile((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        ...profile,
      };
      await api.put('/profile/me', payload);
      setMessage('Profile updated. Stay intentional.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const checklist = [
    { label: 'Bio added', completed: Boolean(profile.bio) },
    { label: 'Interests (3+)', completed: profile.interests?.length >= 3 },
    { label: 'Goals set', completed: profile.goals?.length > 0 },
    { label: 'Preferences set', completed: Boolean(profile.preferences) },
    { label: 'Photos added', completed: profile.photoUrls?.length > 0 },
  ];

  return (
    <div className="grid gap-8 md:grid-cols-[2fr,1fr] md:gap-12">
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Your profile</h1>
              <p className="text-sm text-slate-500">Last updated {dayjs(profile.updatedAt || profile.createdAt).fromNow()}</p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-brand-dark/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
          {message && (
            <p className="mt-3 rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand-dark">{message}</p>
          )}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <TextInput
              label="First name"
              value={profile.firstName}
              onChange={(event) => handleChange('firstName', event.target.value)}
            />
            <TextInput
              label="Last name"
              value={profile.lastName}
              onChange={(event) => handleChange('lastName', event.target.value)}
            />
            <TextInput
              label="Occupation"
              value={profile.occupation}
              onChange={(event) => handleChange('occupation', event.target.value)}
            />
            <TextInput
              label="Age"
              type="number"
              value={profile.age}
              onChange={(event) => handleChange('age', Number(event.target.value))}
            />
            <TextInput
              label="City"
              value={profile.location?.city || ''}
              onChange={(event) => handleNestedChange('location', 'city', event.target.value)}
            />
            <TextInput
              label="Country"
              value={profile.location?.country || ''}
              onChange={(event) => handleNestedChange('location', 'country', event.target.value)}
            />
          </div>
          <label className="mt-6 flex flex-col gap-2 text-sm text-slate-700">
            <span className="font-semibold">Bio</span>
            <textarea
              rows={5}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-dark/20"
              value={profile.bio}
              onChange={(event) => handleChange('bio', event.target.value)}
            />
          </label>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow">
          <h2 className="text-xl font-semibold text-slate-800">Interests</h2>
          <p className="text-sm text-slate-500">Select the experiences that nourish you.</p>
          <div className="mt-4">
            <InterestSelector
              value={profile.interests || []}
              onChange={(value) => handleChange('interests', value)}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow">
          <h2 className="text-xl font-semibold text-slate-800">Relationship goals</h2>
          <GoalSelector
            value={profile.goals || []}
            onChange={(value) => handleChange('goals', value)}
          />
        </div>

        <div className="rounded-3xl bg-white p-8 shadow">
          <h2 className="text-xl font-semibold text-slate-800">Preferences</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SelectInput
              label="Looking to meet"
              value={profile.preferences?.gender || 'female'}
              onChange={(event) => handleNestedChange('preferences', 'gender', event.target.value)}
              options={[
                { value: 'male', label: 'Men' },
                { value: 'female', label: 'Women' },
                { value: 'any', label: 'Anyone (straight only)' },
              ]}
            />
            <div className="grid gap-2 text-sm text-slate-700">
              <span className="font-semibold">Preferred age range</span>
              <div className="flex items-center gap-3">
                <TextInput
                  type="number"
                  value={profile.preferences?.ageRange?.[0] || 25}
                  onChange={(event) => {
                    const max = profile.preferences?.ageRange?.[1] || 60;
                    handleNestedChange('preferences', 'ageRange', [Number(event.target.value), max]);
                  }}
                />
                <span>to</span>
                <TextInput
                  type="number"
                  value={profile.preferences?.ageRange?.[1] || 60}
                  onChange={(event) => {
                    const min = profile.preferences?.ageRange?.[0] || 25;
                    handleNestedChange('preferences', 'ageRange', [min, Number(event.target.value)]);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-slate-800">Profile checklist</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                    item.completed ? 'bg-brand-dark text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {item.completed ? 'Y' : '-'}
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-brand-dark/30 bg-brand/5 p-6 text-sm text-slate-700">
          <p className="font-semibold text-brand-dark">Boost your introductions</p>
          <p className="mt-2">
            Premium members receive spotlight boosts in curated circles and can browse in incognito mode.
          </p>
        </div>
      </aside>
    </div>
  );
};

export default Profile;





