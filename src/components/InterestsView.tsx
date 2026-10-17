import React, { useState } from 'react';
import { Check, Plus, X, RotateCcw, Shield, TrendingUp, Save } from 'lucide-react';
import { Topic, UserProfile } from '../../shared/types.ts';

interface InterestsViewProps {
  profile: UserProfile | null;
  onSaveProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onResetLearning: () => Promise<void>;
}

const ALL_TOPICS: Topic[] = [
  'Technology',
  'Science',
  'Climate',
  'Business',
  'World',
  'Culture',
  'Sports',
];

export const InterestsView: React.FC<InterestsViewProps> = ({
  profile,
  onSaveProfile,
  onResetLearning,
}) => {
  const [explicitTopics, setExplicitTopics] = useState<Topic[]>(
    profile?.explicitTopics || ['Technology', 'Science', 'Climate']
  );
  const [specificInterests, setSpecificInterests] = useState<string[]>(
    profile?.specificInterests || ['AI tools', 'Space exploration']
  );
  const [newTagInput, setNewTagInput] = useState('');
  const [readingMinutes, setReadingMinutes] = useState<5 | 10 | 20>(
    profile?.readingMinutes || 10
  );
  const [timezone, setTimezone] = useState(profile?.timezone || 'America/New_York');
  const [deliveryTime, setDeliveryTime] = useState(profile?.deliveryTime || '07:00');
  const [discoveryEnabled, setDiscoveryEnabled] = useState(profile?.discoveryEnabled ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const toggleTopic = (t: Topic) => {
    if (explicitTopics.includes(t)) {
      if (explicitTopics.length > 1) {
        setExplicitTopics(explicitTopics.filter(item => item !== t));
      }
    } else {
      setExplicitTopics([...explicitTopics, t]);
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagInput.trim() && !specificInterests.includes(newTagInput.trim())) {
      setSpecificInterests([...specificInterests, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setSpecificInterests(specificInterests.filter(t => t !== tag));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveProfile({
      explicitTopics,
      specificInterests,
      readingMinutes,
      timezone,
      deliveryTime,
      discoveryEnabled,
    });
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const learnedEntries = Object.entries(profile?.learnedPreferences || {});

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      {/* Title */}
      <div className="border-b border-[#E5DFD3] pb-6 mb-8">
        <span className="text-xs uppercase tracking-widest text-[#B65B3D] font-bold block mb-1">
          Preferences & Signals
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#252B27]">
          A little more <span className="italic font-normal">you.</span>
        </h1>
        <p className="text-sm text-[#616962] mt-1">
          Your paper should change as you do. Control both your explicit interests and learned signals.
        </p>
      </div>

      <div className="space-y-10">
        {/* 1. Explicit Broad Topics */}
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-wider text-[#616962] font-semibold">
            Your Topics
          </label>
          <p className="text-xs text-[#616962]">
            Choose the core domains that build your primary newsstand.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {ALL_TOPICS.map(t => {
              const isSelected = explicitTopics.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTopic(t)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded border transition-colors ${
                    isSelected
                      ? 'bg-[#B65B3D] text-white border-[#B65B3D] shadow-2xs'
                      : 'bg-white border-[#E5DFD3] text-[#252B27] hover:bg-[#FCFAF6]'
                  }`}
                >
                  <span>{t}</span>
                  {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 opacity-40" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Specific Interests */}
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-wider text-[#616962] font-semibold">
            Specific Interests
          </label>
          <p className="text-xs text-[#616962]">
            Add particular subjects, people, or keywords you'd like to see prioritized.
          </p>

          <div className="flex flex-wrap gap-2 mb-2 items-center">
            {specificInterests.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#E5DFD3] rounded bg-white text-[#252B27]"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-[#616962] hover:text-[#B65B3D]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddTag} className="flex gap-2 max-w-md">
            <input
              type="text"
              value={newTagInput}
              onChange={e => setNewTagInput(e.target.value)}
              placeholder="e.g. Clean tech, space exploration, microchips..."
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#E5DFD3] rounded focus:outline-none focus:border-[#B65B3D]"
            />
            <button
              type="submit"
              disabled={!newTagInput.trim()}
              className="px-3.5 py-1.5 text-xs bg-white hover:bg-[#FCFAF6] border border-[#E5DFD3] rounded font-medium disabled:opacity-50"
            >
              Add specific interest
            </button>
          </form>
        </div>

        {/* 3. Morning Routine & Delivery */}
        <div className="space-y-4 pt-4 border-t border-[#E5DFD3]">
          <label className="block text-xs uppercase tracking-wider text-[#616962] font-semibold">
            Your Morning Schedule
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { min: 5, label: '5 minutes', note: '~5 stories' },
              { min: 10, label: '10 minutes', note: '~8 stories' },
              { min: 20, label: '20 minutes', note: '~12 stories' },
            ].map(item => (
              <button
                key={item.min}
                type="button"
                onClick={() => setReadingMinutes(item.min as 5 | 10 | 20)}
                className={`p-3 rounded text-left border transition-all ${
                  readingMinutes === item.min
                    ? 'border-[#B65B3D] bg-white ring-1 ring-[#B65B3D]'
                    : 'border-[#E5DFD3] bg-[#FCFAF6] hover:border-[#B65B3D]/40'
                }`}
              >
                <span className="block font-serif font-bold text-sm text-[#252B27]">
                  {item.label}
                </span>
                <span className="block text-xs text-[#616962]">{item.note}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#616962] mb-1 font-medium">Delivery time</label>
              <select
                value={deliveryTime}
                onChange={e => setDeliveryTime(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5DFD3] rounded"
              >
                <option value="06:00">6:00 AM</option>
                <option value="06:30">6:30 AM</option>
                <option value="07:00">7:00 AM</option>
                <option value="07:30">7:30 AM</option>
                <option value="08:00">8:00 AM</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#616962] mb-1 font-medium">Timezone</label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5DFD3] rounded"
              >
                <option value="America/New_York">Eastern Time (New York)</option>
                <option value="America/Chicago">Central Time (Chicago)</option>
                <option value="America/Denver">Mountain Time (Denver)</option>
                <option value="America/Los_Angeles">Pacific Time (Los Angeles)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Central Europe (Paris)</option>
                <option value="Asia/Karachi">Pakistan Time (Karachi)</option>
                <option value="Asia/Tokyo">Japan Time (Tokyo)</option>
              </select>
            </div>
          </div>

          {/* Discovery toggle */}
          <div className="flex items-center justify-between p-3.5 border border-[#E5DFD3] rounded bg-white">
            <div>
              <span className="block font-medium text-xs text-[#252B27]">
                Leave room for discovery
              </span>
              <span className="block text-xs text-[#616962]">
                We'll include a few stories outside your usual topics to keep the world open.
              </span>
            </div>
            <input
              type="checkbox"
              checked={discoveryEnabled}
              onChange={e => setDiscoveryEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#B65B3D]"
            />
          </div>
        </div>

        {/* 4. What Your Reading is Teaching Us (Learned Signals Table) */}
        <div className="space-y-3 pt-4 border-t border-[#E5DFD3]">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#616962] font-semibold">
                What your reading is teaching us
              </label>
              <p className="text-xs text-[#616962]">
                Your feedback and reading habits help tune your edition over time.
              </p>
            </div>

            <button
              onClick={onResetLearning}
              className="text-xs text-[#616962] hover:text-[#B65B3D] flex items-center gap-1.5 p-1 transition-colors"
              title="Reset learned weights while keeping your explicit topics"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset learned preferences</span>
            </button>
          </div>

          <div className="border border-[#E5DFD3] rounded bg-white overflow-hidden divide-y divide-[#E5DFD3]">
            {learnedEntries.length > 0 ? (
              learnedEntries.map(([topic, pref]) => {
                const isGrowing = pref.weight > 0.2;
                const isReduced = pref.weight < -0.2;
                return (
                  <div key={topic} className="p-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-[#252B27] w-24">{topic}</span>
                      <span className="text-[#616962]">{pref.note}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          isGrowing
                            ? 'bg-[#EDF2EB] text-[#7D8B72]'
                            : isReduced
                            ? 'bg-[#FFF7ED] text-[#B65B3D]'
                            : 'bg-[#F7F5EF] text-[#616962]'
                        }`}
                      >
                        {isGrowing ? 'Growing interest' : isReduced ? 'Reduced' : 'Steady'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-xs text-[#616962] text-center">
                No learned signals yet. Reading stories, saving articles, or tapping "More like this" will show transparent weights here.
              </div>
            )}
          </div>
        </div>

        {/* 5. Save Button & Privacy Pledge */}
        <div className="pt-6 border-t border-[#E5DFD3] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#616962]">
            <Shield className="w-4 h-4 text-[#7D8B72]" />
            <span>Your reading preferences belong to you. We never sell your data or show you ads.</span>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 rounded bg-[#B65B3D] text-white hover:bg-[#9D4B31] text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
