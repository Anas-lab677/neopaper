import React, { useState, useEffect } from 'react';
import { Sliders, RotateCcw, Trash2, Plus, Sparkles, Check, Globe, Clock, BookOpen, LogOut, CheckCheck, X } from 'lucide-react';
import { Topic, UserProfile } from '../../shared/types.ts';

interface SettingsViewProps {
  profile: UserProfile | null;
  user: any;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onResetLearning: () => Promise<void>;
  onSignOut: () => void;
  onSelectTab: (tab: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  user,
  onUpdateProfile,
  onResetLearning,
  onSignOut,
  onSelectTab,
}) => {
  const availableTopics: Topic[] = [
    'World',
    'Business',
    'Technology',
    'Science',
    'Climate & Environment',
    'Arts & Culture',
    'Sports',
    'Good News',
  ];

  // Unified local state for all preferences
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>(
    profile?.explicitTopics || ['Technology', 'Science', 'World', 'Climate & Environment']
  );
  const [specificInterests, setSpecificInterests] = useState<string[]>(
    profile?.specificInterests || []
  );
  const [readingDepth, setReadingDepth] = useState<'Quick' | 'Standard' | 'Deep'>(
    profile?.readingDepth || (profile?.readingMinutes === 5 ? 'Quick' : profile?.readingMinutes === 20 ? 'Deep' : 'Standard')
  );
  const [region, setRegion] = useState(profile?.region || 'Global');
  const [city, setCity] = useState(profile?.city || '');
  const [timezone, setTimezone] = useState(
    profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [discoveryEnabled, setDiscoveryEnabled] = useState(profile?.discoveryEnabled ?? true);
  const [newInterestInput, setNewInterestInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state whenever profile updates from server / Firebase
  useEffect(() => {
    if (profile) {
      if (profile.explicitTopics && profile.explicitTopics.length > 0) {
        setSelectedTopics(profile.explicitTopics);
      }
      if (profile.specificInterests) {
        setSpecificInterests(profile.specificInterests);
      }
      if (profile.readingDepth) {
        setReadingDepth(profile.readingDepth);
      } else if (profile.readingMinutes) {
        setReadingDepth(profile.readingMinutes === 5 ? 'Quick' : profile.readingMinutes === 20 ? 'Deep' : 'Standard');
      }
      if (profile.region) setRegion(profile.region);
      if (profile.city !== undefined) setCity(profile.city);
      if (profile.timezone) setTimezone(profile.timezone);
      if (profile.discoveryEnabled !== undefined) setDiscoveryEnabled(profile.discoveryEnabled);
    }
  }, [profile]);

  const triggerSaveBadge = (msg = 'Preferences saved') => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3500);
  };

  // Helper to persist full combined snapshot so one never overwrites the other
  const persistFullPreferences = async (overrides: Partial<UserProfile> = {}) => {
    setIsSaving(true);
    let readingMinutes: 5 | 10 | 20 = 10;
    const activeDepth = overrides.readingDepth || readingDepth;
    if (activeDepth === 'Quick') readingMinutes = 5;
    if (activeDepth === 'Deep') readingMinutes = 20;

    const fullSnapshot: Partial<UserProfile> = {
      explicitTopics: overrides.explicitTopics !== undefined ? overrides.explicitTopics : selectedTopics,
      specificInterests: overrides.specificInterests !== undefined ? overrides.specificInterests : specificInterests,
      readingDepth: activeDepth,
      readingMinutes: overrides.readingMinutes || readingMinutes,
      region: overrides.region !== undefined ? overrides.region : region,
      city: (overrides.city !== undefined ? overrides.city : city).trim(),
      timezone: overrides.timezone !== undefined ? overrides.timezone : timezone,
      discoveryEnabled: overrides.discoveryEnabled !== undefined ? overrides.discoveryEnabled : discoveryEnabled,
    };

    const safetyTimer = setTimeout(() => setIsSaving(false), 2000);
    try {
      await onUpdateProfile(fullSnapshot);
      triggerSaveBadge();
    } catch (err) {
      console.error('Settings save error:', err);
    } finally {
      clearTimeout(safetyTimer);
      setIsSaving(false);
    }
  };

  // Toggle single topic
  const handleToggleTopic = async (topic: Topic) => {
    const updated = selectedTopics.includes(topic)
      ? selectedTopics.filter((t: Topic) => t !== topic)
      : [...selectedTopics, topic];

    setSelectedTopics(updated);
    await persistFullPreferences({ explicitTopics: updated });
  };

  // Select all topics
  const handleSelectAllTopics = async () => {
    setSelectedTopics(availableTopics);
    await persistFullPreferences({ explicitTopics: availableTopics });
  };

  // Clear all topics
  const handleClearAllTopics = async () => {
    setSelectedTopics([]);
    await persistFullPreferences({ explicitTopics: [] });
  };

  // Add specific interest
  const handleAddInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newInterestInput.trim();
    if (!clean) return;
    if (!specificInterests.includes(clean)) {
      const updated = [...specificInterests, clean];
      setSpecificInterests(updated);
      setNewInterestInput('');
      await persistFullPreferences({ specificInterests: updated });
    }
  };

  // Remove specific interest
  const handleRemoveInterest = async (interest: string) => {
    const updated = specificInterests.filter((i: string) => i !== interest);
    setSpecificInterests(updated);
    await persistFullPreferences({ specificInterests: updated });
  };

  // Save all general preferences button
  const handleSaveAll = async () => {
    await persistFullPreferences();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="border-b border-[#1C1917] pb-4 flex items-end justify-between flex-wrap gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8C2D19] font-semibold">Preferences</span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1917] tracking-tight">
            Settings & Reading Ritual
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus && (
            <span className="text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded border border-green-200 flex items-center gap-1 font-medium animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              {saveStatus}
            </span>
          )}
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-4 py-2 bg-[#8C2D19] text-[#FAF9F6] hover:bg-[#7A2616] rounded text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSaving ? <CheckCheck className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Save All Settings</span>
          </button>
        </div>
      </div>

      {/* Topics Selection */}
      <section className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-serif font-bold text-[#1C1917]">
                Explicit News Topics
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF9F6] border border-[#E7E5E4] text-[#8C2D19] font-medium">
                {selectedTopics.length} selected
              </span>
            </div>
            <p className="text-xs text-[#78716C] mt-0.5">
              Select the broad editorial sections you want represented in each daily edition.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllTopics}
              className="text-xs text-[#8C2D19] hover:underline font-medium px-2 py-1"
            >
              Select All
            </button>
            <span className="text-[#D6D3D1]">|</span>
            <button
              type="button"
              onClick={handleClearAllTopics}
              className="text-xs text-[#78716C] hover:text-[#1C1917] hover:underline px-2 py-1"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {availableTopics.map(t => {
            const isSelected = selectedTopics.includes(t);
            return (
              <button
                key={t}
                onClick={() => handleToggleTopic(t)}
                className={`px-3.5 py-2 rounded text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-[#1C1917] text-[#FAF9F6] border-[#1C1917] shadow-sm'
                    : 'bg-[#FAF9F6] text-[#78716C] border-[#E7E5E4] hover:border-[#1C1917] hover:text-[#1C1917]'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}
                {t}
              </button>
            );
          })}
        </div>
        {selectedTopics.length === 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            Tip: Please select at least one topic so Daybreak knows which stories to fetch for your daily edition.
          </p>
        )}
      </section>

      {/* Followed Free-Text Specific Interests */}
      <section className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg p-6 space-y-4 shadow-sm">
        <div>
          <h2 className="text-lg font-serif font-bold text-[#1C1917]">
            Followed Specific Inquiries
          </h2>
          <p className="text-xs text-[#78716C] mt-0.5">
            Exact topics, sports clubs, emerging technologies, or entities you follow.
          </p>
        </div>

        {/* Input */}
        <form onSubmit={handleAddInterest} className="flex gap-2">
          <input
            type="text"
            value={newInterestInput}
            onChange={e => setNewInterestInput(e.target.value)}
            placeholder="e.g. Pakistan cricket, AI startups, European rail"
            className="flex-1 text-xs px-3 py-2 bg-[#FAF9F6] border border-[#D6D3D1] rounded focus:border-[#1C1917] focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#1C1917] text-[#FAF9F6] hover:bg-[#8C2D19] rounded text-xs font-medium transition-colors flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Interest</span>
          </button>
        </form>

        {/* List of followed interests */}
        <div className="flex flex-wrap gap-2 pt-2">
          {specificInterests && specificInterests.length > 0 ? (
            specificInterests.map((item: string) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#FAF9F6] border border-[#E7E5E4] text-xs text-[#1C1917]"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(item)}
                  className="text-[#78716C] hover:text-[#8C2D19] font-bold ml-0.5"
                  title="Unfollow"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          ) : (
            <p className="text-xs text-[#A8A29E] italic">
              No specific interests added yet. Type an interest above or click "Follow this interest" on search results.
            </p>
          )}
        </div>
      </section>

      {/* Reading Depth, Geography & Timezone */}
      <section className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg p-6 space-y-6 shadow-sm">
        <div>
          <h2 className="text-lg font-serif font-bold text-[#1C1917]">
            Delivery, Scope & Geography
          </h2>
          <p className="text-xs text-[#78716C] mt-0.5">
            Configure how your broadsheet is constructed each morning.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          {/* Reading Depth */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#1C1917] block">Reading Depth</label>
            <select
              value={readingDepth}
              onChange={e => {
                const val = e.target.value as 'Quick' | 'Standard' | 'Deep';
                setReadingDepth(val);
                persistFullPreferences({ readingDepth: val });
              }}
              className="w-full p-2 bg-[#FAF9F6] border border-[#D6D3D1] rounded focus:border-[#1C1917] focus:outline-none"
            >
              <option value="Quick">Quick (~5 minutes · 6-8 stories)</option>
              <option value="Standard">Standard (~10 minutes · 10-14 stories)</option>
              <option value="Deep">Deep (~20 minutes · 16-20 stories)</option>
            </select>
            <p className="text-[11px] text-[#A8A29E]">Governs target article count in your morning broadsheet.</p>
          </div>

          {/* Region / Country */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#1C1917] block">Geographic Scope</label>
            <select
              value={region}
              onChange={e => {
                setRegion(e.target.value);
                persistFullPreferences({ region: e.target.value });
              }}
              className="w-full p-2 bg-[#FAF9F6] border border-[#D6D3D1] rounded focus:border-[#1C1917] focus:outline-none"
            >
              <option value="Global">Global / International</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Pakistan">Pakistan</option>
              <option value="France">France / Europe</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
            </select>
          </div>

          {/* City / Specific Place */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#1C1917] block">City / Regional Focus (Optional)</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              onBlur={() => persistFullPreferences({ city })}
              placeholder="e.g. Karachi, London, New York, Paris"
              className="w-full p-2 bg-[#FAF9F6] border border-[#D6D3D1] rounded focus:border-[#1C1917] focus:outline-none"
            />
            <p className="text-[11px] text-[#A8A29E]">Prioritizes genuine reporting mentioning this city.</p>
          </div>

          {/* Timezone */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#1C1917] block">Reader Timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              onBlur={() => persistFullPreferences({ timezone })}
              className="w-full p-2 bg-[#FAF9F6] border border-[#D6D3D1] rounded focus:border-[#1C1917] focus:outline-none"
            />
            <p className="text-[11px] text-[#A8A29E]">Controls when a new morning date snapshot begins.</p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-[#E7E5E4] flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={discoveryEnabled}
              onChange={e => {
                setDiscoveryEnabled(e.target.checked);
                persistFullPreferences({ discoveryEnabled: e.target.checked });
              }}
              className="rounded border-[#D6D3D1]"
            />
            <span className="text-[#1C1917] font-medium">Include 1 Discovery Story</span>
            <span className="text-[#A8A29E]">(A fresh perspective outside your usual topics)</span>
          </label>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#1C1917] text-[#FAF9F6] hover:bg-[#8C2D19] rounded text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? <CheckCheck className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Save All Preferences</span>
          </button>
        </div>
      </section>

      {/* LEARNED SIGNALS TRANSPARENCY */}
      <section className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8C2D19]" />
              <h2 className="text-lg font-serif font-bold text-[#1C1917]">
                What Daybreak Has Learned About You
              </h2>
            </div>
            <p className="text-xs text-[#78716C] mt-0.5">
              Derived from your searches, "More like this" feedback, and skipped articles.
            </p>
          </div>

          <button
            onClick={onResetLearning}
            className="px-3 py-1.5 bg-[#FAF9F6] border border-[#D6D3D1] hover:border-[#8C2D19] text-[#8C2D19] rounded text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Feedback</span>
          </button>
        </div>

        {/* Display learned preferences */}
        {profile?.learnedPreferences && Object.keys(profile.learnedPreferences).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {Object.entries(profile.learnedPreferences).map(([topic, rawData]) => {
              const data = rawData as { weight: number; count: number; note: string };
              return (
                <div key={topic} className="p-3 bg-[#FAF9F6] border border-[#E7E5E4] rounded text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1C1917]">{topic}</span>
                    <span className={`text-[11px] font-medium ${data.weight > 0 ? 'text-green-700' : 'text-stone-500'}`}>
                      {data.weight > 0 ? `+${(data.weight * 100).toFixed(0)}%` : `${(data.weight * 100).toFixed(0)}%`}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#78716C]">{data.note || `${data.count} reader interactions`}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[#A8A29E] italic py-2">
            No learned signals yet. As you like, dislike, or search topics, your personal weights will appear here.
          </p>
        )}

        {/* Search Signals */}
        {profile?.searchSignals && Object.keys(profile.searchSignals).length > 0 && (
          <div className="pt-3 border-t border-[#E7E5E4] text-xs space-y-2">
            <span className="font-semibold text-[#1C1917] uppercase tracking-wider text-[10px] block">
              Recent Search Inquiries
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.values(profile.searchSignals).map(rawSig => {
                const sig = rawSig as { query: string; count: number; lastSearchedAt: string };
                return (
                  <span key={sig.query} className="px-2 py-1 bg-[#FAF9F6] border border-[#E7E5E4] rounded text-[11px] text-[#78716C]">
                    “{sig.query}” ({sig.count}x)
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Account & Sign Out */}
      <section className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg p-6 flex items-center justify-between shadow-sm">
        <div>
          <h3 className="text-sm font-semibold text-[#1C1917]">Account Identity</h3>
          <p className="text-xs text-[#78716C]">{user?.email || 'Guest Reader'}</p>
        </div>
        {user && (
          <button
            onClick={onSignOut}
            className="px-4 py-2 bg-[#FAF9F6] border border-[#D6D3D1] hover:border-[#8C2D19] text-[#8C2D19] rounded text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </section>
    </div>
  );
};
