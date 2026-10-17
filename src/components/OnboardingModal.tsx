import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Newspaper, Clock, Compass, MapPin, Sparkles } from 'lucide-react';
import type { Topic, UserProfile } from '../../shared/types.ts';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profile: Partial<UserProfile>) => void;
  initialProfile: UserProfile | null;
}

const ALL_TOPICS: Topic[] = [
  'World',
  'Business',
  'Technology',
  'Science',
  'Climate & Environment',
  'Arts & Culture',
  'Sports',
  'Good News',
];

const READING_DEPTHS = [
  { value: 'Quick' as const, minutes: 5 as const, label: '~5 min', desc: 'Headlines & key takeaways' },
  { value: 'Standard' as const, minutes: 10 as const, label: '~10 min', desc: 'Balanced briefs with context' },
  { value: 'Deep' as const, minutes: 20 as const, label: '~20 min', desc: 'In-depth analysis & discovery' },
];

export function OnboardingModal({
  isOpen,
  onClose,
  onComplete,
  initialProfile,
}: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>(
    initialProfile?.explicitTopics || ['World', 'Technology', 'Science']
  );
  const [readingDepth, setReadingDepth] = useState<'Quick' | 'Standard' | 'Deep'>(
    initialProfile?.readingDepth || 'Standard'
  );
  const [readingMinutes, setReadingMinutes] = useState<5 | 10 | 20>(
    initialProfile?.readingMinutes || 10
  );
  const [discoveryEnabled, setDiscoveryEnabled] = useState(
    initialProfile?.discoveryEnabled ?? true
  );
  const [specificInterests, setSpecificInterests] = useState<string>(
    (initialProfile?.specificInterests || []).join(', ')
  );
  const [region, setRegion] = useState(initialProfile?.region || '');

  if (!isOpen) return null;

  const steps = [
    { icon: Newspaper, title: 'Your Topics' },
    { icon: Clock, title: 'Reading Pace' },
    { icon: Compass, title: 'Personalize' },
  ];

  const toggleTopic = (topic: Topic) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleFinish = () => {
    const interests = specificInterests
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    onComplete({
      explicitTopics: selectedTopics,
      readingDepth,
      readingMinutes,
      discoveryEnabled,
      specificInterests: interests,
      region: region || undefined,
      onboardingCompleted: true,
    });
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto flex items-start sm:items-center justify-center p-4 pt-10 sm:pt-16 bg-[#1C1917]/50 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg mx-auto bg-[#FAF9F6] rounded-xl shadow-2xl border border-[#E7E5E4] overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4]">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#8C2D19]" />
            <h2
              className="text-lg font-semibold text-[#1C1917]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Customize Your Paper
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#E7E5E4] text-[#78716C] hover:text-[#1C1917] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 px-6 pt-4">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i === step
                    ? 'bg-[#8C2D19] text-[#FAF9F6]'
                    : i < step
                      ? 'bg-[#8C2D19]/20 text-[#8C2D19]'
                      : 'bg-[#E7E5E4] text-[#78716C]'
                }`}
              >
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? 'bg-[#8C2D19]/40' : 'bg-[#E7E5E4]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 min-h-[280px]">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-[#1C1917] mb-1">Select your topics</h3>
                <p className="text-xs text-[#78716C]">Choose the sections for your daily broadsheet.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ALL_TOPICS.map(topic => (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all border ${
                      selectedTopics.includes(topic)
                        ? 'bg-[#8C2D19] text-[#FAF9F6] border-[#8C2D19] shadow-sm'
                        : 'bg-white text-[#1C1917] border-[#E7E5E4] hover:border-[#8C2D19]/40'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-[#1C1917] mb-1">Reading pace</h3>
                <p className="text-xs text-[#78716C]">How much time do you have each morning?</p>
              </div>
              <div className="space-y-2">
                {READING_DEPTHS.map(rd => (
                  <button
                    key={rd.value}
                    onClick={() => {
                      setReadingDepth(rd.value);
                      setReadingMinutes(rd.minutes);
                    }}
                    className={`w-full px-4 py-3 rounded-lg text-left transition-all border flex items-center justify-between ${
                      readingDepth === rd.value
                        ? 'bg-[#8C2D19] text-[#FAF9F6] border-[#8C2D19] shadow-sm'
                        : 'bg-white text-[#1C1917] border-[#E7E5E4] hover:border-[#8C2D19]/40'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold">{rd.value}</p>
                      <p className={`text-xs mt-0.5 ${readingDepth === rd.value ? 'text-[#FAF9F6]/70' : 'text-[#78716C]'}`}>
                        {rd.desc}
                      </p>
                    </div>
                    <span className={`text-xs font-mono ${readingDepth === rd.value ? 'text-[#FAF9F6]/80' : 'text-[#78716C]'}`}>
                      {rd.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-[#1C1917] mb-1">Fine-tune your paper</h3>
                <p className="text-xs text-[#78716C]">Optional details for better personalization.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1C1917] mb-1">Specific interests</label>
                <input
                  type="text"
                  value={specificInterests}
                  onChange={e => setSpecificInterests(e.target.value)}
                  placeholder="e.g. AI startups, renewable energy, NBA"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#8C2D19] focus:ring-1 focus:ring-[#8C2D19]/30 placeholder:text-[#A8A29E]"
                />
                <p className="text-xs text-[#78716C] mt-1">Comma-separated topics you want highlighted.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1C1917] mb-1">Region (optional)</label>
                <input
                  type="text"
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  placeholder="e.g. South Asia, Bay Area, UK"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#8C2D19] focus:ring-1 focus:ring-[#8C2D19]/30 placeholder:text-[#A8A29E]"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`w-10 h-6 rounded-full relative transition-colors ${
                    discoveryEnabled ? 'bg-[#8C2D19]' : 'bg-[#D6D3D1]'
                  }`}
                  onClick={() => setDiscoveryEnabled(!discoveryEnabled)}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      discoveryEnabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1C1917]">Enable Discovery</p>
                  <p className="text-xs text-[#78716C]">Include surprise stories outside your usual topics.</p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E7E5E4] bg-[#F5F5F4]">
          <button
            onClick={() => (step > 0 ? setStep(step - 1) : onClose())}
            className="flex items-center gap-1 px-4 py-2 text-sm text-[#78716C] hover:text-[#1C1917] rounded-lg hover:bg-[#E7E5E4] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step > 0 ? 'Back' : 'Skip'}
          </button>
          <button
            onClick={() => (step < steps.length - 1 ? setStep(step + 1) : handleFinish())}
            disabled={step === 0 && selectedTopics.length === 0}
            className="flex items-center gap-1 px-5 py-2.5 text-sm font-semibold text-[#FAF9F6] bg-[#8C2D19] rounded-lg hover:bg-[#7A2616] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step < steps.length - 1 ? (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              'Finish'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
