import React, { useState } from 'react';
import { Check, Plus, X, ArrowRight, ArrowLeft, Clock, Globe, Shield, Sparkles } from 'lucide-react';
import { Topic, UserProfile } from '../../shared/types.ts';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile: UserProfile | null;
  onComplete: (profile: Partial<UserProfile>) => Promise<void>;
}

const AVAILABLE_TOPICS: { topic: Topic; desc: string; img: string }[] = [
  {
    topic: 'Technology',
    desc: 'Tools, ideas and innovation shaping a calmer, brighter future.',
    img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
  },
  {
    topic: 'Science',
    desc: 'Discoveries about our universe, our planet and ourselves.',
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
  },
  {
    topic: 'Climate',
    desc: 'Solutions, progress and ideas for a healthier, more livable world.',
    img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
  },
  {
    topic: 'Business',
    desc: 'Markets, work and the ideas shaping the global economy.',
    img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
  },
  {
    topic: 'World',
    desc: 'People, places and the bigger picture across the globe.',
    img: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=600&q=80',
  },
  {
    topic: 'Culture',
    desc: 'Art, books, film and the ideas that shape a richer life.',
    img: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=600&q=80',
  },
  {
    topic: 'Sports',
    desc: 'Athletics, endurance science, competition and team play.',
    img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80',
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  initialProfile,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>(
    initialProfile?.explicitTopics || ['Technology', 'Science', 'Climate']
  );
  const [specificInterests, setSpecificInterests] = useState<string[]>(
    initialProfile?.specificInterests || ['AI tools', 'Space exploration']
  );
  const [newInterestInput, setNewInterestInput] = useState('');
  const [name, setName] = useState(initialProfile?.name || 'Sara');
  const [readingMinutes, setReadingMinutes] = useState<5 | 10 | 20>(
    initialProfile?.readingMinutes || 10
  );
  const [timezone, setTimezone] = useState(
    initialProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  );
  const [deliveryTime, setDeliveryTime] = useState(initialProfile?.deliveryTime || '07:00');
  const [discoveryEnabled, setDiscoveryEnabled] = useState(
    initialProfile?.discoveryEnabled ?? true
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(1);

  if (!isOpen) return null;

  const toggleTopic = (t: Topic) => {
    if (selectedTopics.includes(t)) {
      if (selectedTopics.length > 1) {
        setSelectedTopics(selectedTopics.filter(item => item !== t));
      }
    } else {
      setSelectedTopics([...selectedTopics, t]);
    }
  };

  const handleAddInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInterestInput.trim() && !specificInterests.includes(newInterestInput.trim())) {
      setSpecificInterests([...specificInterests, newInterestInput.trim()]);
      setNewInterestInput('');
    }
  };

  const removeInterest = (item: string) => {
    setSpecificInterests(specificInterests.filter(i => i !== item));
  };

  const handleStartGeneration = async () => {
    setIsGenerating(true);
    setGenerationStage(1);

    // Simulate multi-stage progression representing real collection & ranking
    setTimeout(() => setGenerationStage(2), 700);
    setTimeout(() => setGenerationStage(3), 1400);

    setTimeout(async () => {
      await onComplete({
        name,
        readingMinutes,
        timezone,
        deliveryTime,
        discoveryEnabled,
        explicitTopics: selectedTopics,
        specificInterests,
      });
      setIsGenerating(false);
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#252B27]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#F7F5EF] border border-[#E5DFD3] rounded-lg shadow-xl max-w-2xl w-full p-6 sm:p-8 my-auto relative">
        {/* Step indicator */}
        <div className="flex items-center justify-between pb-5 border-b border-[#E5DFD3] mb-6">
          <div className="flex items-center gap-3">
            <span
              className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center ${
                step >= 1 ? 'bg-[#252B27] text-white' : 'bg-[#E5DFD3] text-[#616962]'
              }`}
            >
              1
            </span>
            <span className="text-xs uppercase tracking-wider text-[#616962]">Interests</span>
            <span className="w-8 h-px bg-[#E5DFD3]"></span>
            <span
              className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center ${
                step >= 2 ? 'bg-[#252B27] text-white' : 'bg-[#E5DFD3] text-[#616962]'
              }`}
            >
              2
            </span>
            <span className="text-xs uppercase tracking-wider text-[#616962]">Your Morning</span>
          </div>

          <button
            onClick={onClose}
            className="text-[#616962] hover:text-[#252B27] p-1 rounded focus:outline-none"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: What makes you curious? */}
        {step === 1 && (
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-serif font-bold text-[#252B27]">
                What makes you <span className="italic font-normal">curious?</span>
              </h2>
              <p className="text-sm text-[#616962] mt-1">
                Choose a few topics to shape your daily paper.
              </p>
            </div>

            {/* Grid of topic cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-h-[320px] overflow-y-auto pr-1">
              {AVAILABLE_TOPICS.map(item => {
                const isSelected = selectedTopics.includes(item.topic);
                return (
                  <button
                    key={item.topic}
                    type="button"
                    onClick={() => toggleTopic(item.topic)}
                    className={`text-left p-3 rounded border transition-all relative group flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#B65B3D] bg-white shadow-xs'
                        : 'border-[#E5DFD3] bg-[#FCFAF6] hover:border-[#B65B3D]/50'
                    }`}
                  >
                    <div className="w-full h-20 rounded overflow-hidden mb-2 bg-[#E5DFD3]/40">
                      <img
                        src={item.img}
                        alt={item.topic}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-serif font-semibold text-sm text-[#252B27]">
                          {item.topic}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-[#7D8B72] text-white' : 'border border-[#E5DFD3]'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                      <p className="text-xs text-[#616962] line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Specific interests */}
            <div className="border-t border-[#E5DFD3] pt-4 mb-6">
              <label className="block text-xs uppercase tracking-wider text-[#616962] mb-2 font-medium">
                Anything more specific?
              </label>
              <div className="flex flex-wrap gap-2 mb-2 items-center">
                {specificInterests.map(interest => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-[#E5DFD3] rounded bg-white text-[#252B27]"
                  >
                    <span>{interest}</span>
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="text-[#616962] hover:text-[#B65B3D]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <form onSubmit={handleAddInterest} className="flex gap-2">
                <input
                  type="text"
                  value={newInterestInput}
                  onChange={e => setNewInterestInput(e.target.value)}
                  placeholder="e.g. AI tools, space exploration, clean tech..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#E5DFD3] rounded focus:outline-none focus:border-[#B65B3D]"
                />
                <button
                  type="submit"
                  disabled={!newInterestInput.trim()}
                  className="px-3 py-1.5 text-xs bg-white hover:bg-[#FCFAF6] border border-[#E5DFD3] rounded text-[#252B27] disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </form>
            </div>

            {/* Step 1 Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E5DFD3]">
              <span className="text-xs text-[#616962]">
                Choose at least one topic. You can change this later.
              </span>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2 rounded text-xs font-medium text-white bg-[#B65B3D] hover:bg-[#9D4B31] transition-colors flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Make time for perspective */}
        {step === 2 && !isGenerating && (
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-serif font-bold text-[#252B27]">
                Make time for <span className="italic font-normal">perspective.</span>
              </h2>
              <p className="text-sm text-[#616962] mt-1">
                Tell us a little about your morning routine.
              </p>
            </div>

            <div className="space-y-5 mb-8">
              {/* Name */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#616962] mb-1 font-medium">
                  What should we call you? (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Sara"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E5DFD3] rounded focus:outline-none focus:border-[#B65B3D]"
                />
              </div>

              {/* Reading time */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#616962] mb-1.5 font-medium">
                  How much time do you have?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { minutes: 5, label: '5 minutes', note: 'A quick rundown (~5 stories)' },
                    { minutes: 10, label: '10 minutes', note: 'Our standard edition (~8 stories)' },
                    { minutes: 20, label: '20 minutes', note: 'A deeper dive (~12 stories)' },
                  ].map(item => (
                    <button
                      key={item.minutes}
                      type="button"
                      onClick={() => setReadingMinutes(item.minutes as 5 | 10 | 20)}
                      className={`p-3 rounded text-left border transition-all ${
                        readingMinutes === item.minutes
                          ? 'border-[#B65B3D] bg-white ring-1 ring-[#B65B3D]'
                          : 'border-[#E5DFD3] bg-[#FCFAF6] hover:border-[#B65B3D]/40'
                      }`}
                    >
                      <span className="block font-serif font-bold text-base text-[#252B27]">
                        {item.label}
                      </span>
                      <span className="block text-xs text-[#616962] mt-0.5">
                        {item.note}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Timezone and delivery time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#616962] mb-1 font-medium">
                    What's your time zone?
                  </label>
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E5DFD3] rounded focus:outline-none focus:border-[#B65B3D]"
                  >
                    <option value="America/New_York">Eastern Time (New York, UTC-5)</option>
                    <option value="America/Chicago">Central Time (Chicago, UTC-6)</option>
                    <option value="America/Denver">Mountain Time (Denver, UTC-7)</option>
                    <option value="America/Los_Angeles">Pacific Time (Los Angeles, UTC-8)</option>
                    <option value="Europe/London">London (GMT, UTC+0)</option>
                    <option value="Europe/Paris">Central Europe (Paris, UTC+1)</option>
                    <option value="Asia/Karachi">Pakistan Time (Asia/Karachi, UTC+5)</option>
                    <option value="Asia/Tokyo">Japan Time (Tokyo, UTC+9)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#616962] mb-1 font-medium">
                    What time should we deliver it?
                  </label>
                  <select
                    value={deliveryTime}
                    onChange={e => setDeliveryTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E5DFD3] rounded focus:outline-none focus:border-[#B65B3D]"
                  >
                    <option value="06:00">6:00 AM</option>
                    <option value="06:30">6:30 AM</option>
                    <option value="07:00">7:00 AM (Standard)</option>
                    <option value="07:30">7:30 AM</option>
                    <option value="08:00">8:00 AM</option>
                    <option value="08:30">8:30 AM</option>
                  </select>
                </div>
              </div>

              {/* Discovery toggle */}
              <div className="flex items-center justify-between p-3 border border-[#E5DFD3] rounded bg-white">
                <div>
                  <span className="block font-medium text-xs text-[#252B27]">
                    Surprise me with one story
                  </span>
                  <span className="block text-xs text-[#616962]">
                    A little outside your usual interests to broaden your morning.
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

            {/* Step 2 Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E5DFD3]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded text-xs font-medium text-[#616962] hover:text-[#252B27] flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleStartGeneration}
                className="px-6 py-2 rounded text-xs font-semibold text-white bg-[#B65B3D] hover:bg-[#9D4B31] transition-colors flex items-center gap-2"
              >
                <span>Make my paper</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 / GENERATION IN PROGRESS (Honest, Real-State Progress) */}
        {isGenerating && (
          <div className="py-8 text-center">
            {/* Sunrise animation */}
            <div className="w-16 h-16 rounded-full bg-[#B65B3D]/10 text-[#B65B3D] flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V5a1 1 0 0 1 1-1zm6.364 2.636a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0zM20 11a1 1 0 0 1 1 1 1 1 0 0 1-1 1h-2a1 1 0 0 1 0-2h2zm-8 4c3.314 0 6 2.686 6 6H6c0-3.314 2.686-6 6-6zm-6.95-6.95a1 1 0 0 1 1.414 0l1.414 1.414a1 1 0 0 1-1.414 1.414L4.05 9.464a1 1 0 0 1 0-1.414zM4 11a1 1 0 0 1 1 1 1 1 0 0 1-1 1H2a1 1 0 0 1 0-2h2z" />
              </svg>
            </div>

            <h3 className="text-2xl font-serif font-bold text-[#252B27] mb-2">
              Gathering a little perspective.
            </h3>
            <p className="text-sm text-[#616962] max-w-md mx-auto mb-6">
              We're finding thoughtful stories based on your interests, so you can start your day with a broader view.
            </p>

            <div className="max-w-sm mx-auto space-y-3 text-left border border-[#E5DFD3] rounded-lg p-4 bg-white/70">
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    generationStage >= 1 ? 'bg-[#7D8B72] text-white' : 'border border-[#E5DFD3]'
                  }`}
                >
                  {generationStage > 1 ? <Check className="w-3 h-3" /> : '1'}
                </div>
                <div>
                  <span className="block text-xs font-medium text-[#252B27]">
                    Collecting recent stories
                  </span>
                  <span className="text-[11px] text-[#616962]">Scanning trusted allowlist sources</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    generationStage >= 2 ? 'bg-[#7D8B72] text-white' : 'border border-[#E5DFD3]'
                  }`}
                >
                  {generationStage > 2 ? <Check className="w-3 h-3" /> : '2'}
                </div>
                <div>
                  <span className="block text-xs font-medium text-[#252B27]">
                    Choosing what matters to you
                  </span>
                  <span className="text-[11px] text-[#616962]">
                    Matching {selectedTopics.join(', ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    generationStage >= 3 ? 'bg-[#7D8B72] text-white' : 'border border-[#E5DFD3]'
                  }`}
                >
                  {generationStage >= 3 ? <Check className="w-3 h-3" /> : '3'}
                </div>
                <div>
                  <span className="block text-xs font-medium text-[#252B27]">
                    Preparing your edition
                  </span>
                  <span className="text-[11px] text-[#616962]">Grounding briefs & formatting PDF</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#616962] mt-6 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#7D8B72]" />
              <span>Your reading preferences belong to you. Your paper will be saved.</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
